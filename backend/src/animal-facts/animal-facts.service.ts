import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { AnimalFact, DailyAnimalCache } from './interfaces/animal-fact.interface';

@Injectable()
export class AnimalFactsService {
  private readonly logger = new Logger(AnimalFactsService.name);
  private readonly bedrockClient: BedrockRuntimeClient;
  private cache: DailyAnimalCache | null = null;

  private readonly animals = [
    'Lion', 'Tiger', 'Elephant', 'Giraffe', 'Penguin',
    'Octopus', 'Dolphin', 'Eagle', 'Kangaroo', 'Panda'
  ];

  constructor(private readonly configService: ConfigService) {
    const awsRegion = this.configService.get<string>('AWS_REGION');
    
    if (!awsRegion) {
      throw new Error('AWS_REGION is not configured');
    }

    const clientConfig = {
      region: awsRegion,
    };

    this.bedrockClient = new BedrockRuntimeClient(clientConfig);

    this.logger.log('Bedrock client initialized successfully');
  }

  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getAnimalForDay(): string {
    const now = new Date();
    const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 1);
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24));
    return this.animals[dayOfYear % this.animals.length];
  }

  private createExpiryDate(): Date {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  }

  private async generateFactFromBedrock(animal: string): Promise<string> {
    const prompt = `Write one interesting fact about ${animal}. Be direct and concise. Do not include introductory phrases or additional text.`;

    const payload = {
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: 150,
        temperature: 0.7,
        topP: 0.9,
      },
    };

    const modelId = this.configService.get<string>('AWS_BEDROCK_MODEL_ID') || 'amazon.titan-text-lite-v1';
    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    this.logger.log(`Calling Bedrock with model: ${modelId} for animal: ${animal}`);

    try {
      const response = await this.bedrockClient.send(command);

      if (!response.body) {
        throw new Error('No response body received from Bedrock');
      }

      const responseBodyString = new TextDecoder().decode(response.body);
      const responseBody = JSON.parse(responseBodyString);

      // Titan response format
      const fact = responseBody?.results?.[0]?.outputText;
      if (typeof fact !== 'string' || fact.length === 0) {
        throw new Error(`Unexpected response structure or empty fact: ${JSON.stringify(responseBody)}`);
      }

      const cleanedFact = fact.trim();
      this.logger.log(`Successfully generated fact for ${animal}`);

      return cleanedFact;
    } catch (error) {
      this.logger.error(`Failed to generate fact for ${animal}: ${error.message}`);
      
      // Log specific AWS Bedrock errors
      if (error.name === 'AccessDeniedException') {
        this.logger.error('AWS Bedrock Access Denied - check IAM permissions');
      } else if (error.name === 'ValidationException') {
        this.logger.error('AWS Bedrock Validation Error - check model ID and payload format');
      } else if (error.name === 'ThrottlingException') {
        this.logger.error('AWS Bedrock request throttled - too many requests');
      } else if (error.name === 'ServiceUnavailableException') {
        this.logger.error('AWS Bedrock service temporarily unavailable');
      } else if (error.name === 'ResourceNotFoundException') {
        this.logger.error('AWS Bedrock model not found - check model ID and region');
      }
      
      // Log error metadata if available
      if (error.$metadata) {
        this.logger.error(`AWS Bedrock error metadata: ${JSON.stringify(error.$metadata)}`);
      }
      
      return `${animal} is an amazing creature with many fascinating characteristics that make it unique in the animal kingdom.`;
    }
  }

  async getDailyAnimalFact(): Promise<AnimalFact> {
    const todayKey = this.getTodayKey();

    if (!this.cache || this.cache.date !== todayKey) {
      this.logger.log(`New daily animal fact needed for ${todayKey}`);
      const selectedAnimal = this.getAnimalForDay();
      this.cache = {
        selectedAnimal,
        date: todayKey,
        expiresAt: this.createExpiryDate(),
      };
      this.logger.log(`Selected new animal for ${todayKey}: ${selectedAnimal}`);
    }

    if (!this.cache.fact) {
      this.logger.log(`Generating fact for ${this.cache.selectedAnimal}`);
      this.cache.fact = await this.generateFactFromBedrock(this.cache.selectedAnimal);
    }

    return {
      animal: this.cache.selectedAnimal,
      fact: this.cache.fact!,
      date: this.cache.date,
      expiresAt: this.cache.expiresAt,
    };
  }

}
