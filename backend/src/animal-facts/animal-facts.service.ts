import { Injectable, Logger } from '@nestjs/common';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { AnimalFact, DailyAnimalCache } from './interfaces/animal-fact.interface';

@Injectable()
export class AnimalFactsService {
  private readonly logger = new Logger(AnimalFactsService.name);
  private readonly bedrockClient: BedrockRuntimeClient;
  private cache: Map<string, DailyAnimalCache> = new Map();

  private readonly animals = [
    'Lion', 'Tiger', 'Elephant', 'Giraffe', 'Penguin',
    'Octopus', 'Dolphin', 'Eagle', 'Kangaroo', 'Panda'
  ];

  constructor() {
    const awsRegion = process.env.AWS_REGION;

    const clientConfig = {
      region: awsRegion,
    };

    this.bedrockClient = new BedrockRuntimeClient(clientConfig);

    this.logger.log('Bedrock client initialized successfully');
  }

  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getRandomAnimal(): string {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return this.animals[dayOfYear % this.animals.length];
  }

  private createExpiryDate(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
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

    const modelId = process.env.AWS_BEDROCK_MODEL_ID;
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
      if (!responseBody.results || !responseBody.results[0] || !responseBody.results[0].outputText) {
        throw new Error(`Unexpected response structure: ${JSON.stringify(responseBody)}`);
      }

      let fact = responseBody.results[0].outputText.trim();


      this.logger.log(`Successfully generated fact for ${animal}`);

      return fact;
    } catch (error) {
      this.logger.error(`Failed to generate fact for ${animal}: ${error.message}`);
      return `${animal} is an amazing creature with many fascinating characteristics that make it unique in the animal kingdom.`;
    }
  }

  async getDailyAnimalFact(): Promise<AnimalFact> {
    const todayKey = this.getTodayKey();
    let cached = this.cache.get(todayKey);

    if (!cached || cached.expiresAt < new Date()) {
      const selectedAnimal = this.getRandomAnimal();
      cached = {
        selectedAnimal,
        date: todayKey,
        expiresAt: this.createExpiryDate(),
      };
      this.cache.set(todayKey, cached);
      this.logger.log(`Selected new animal for ${todayKey}: ${selectedAnimal}`);
    }

    if (!cached.fact) {
      this.logger.log(`Generating fact for ${cached.selectedAnimal}`);
      cached.fact = await this.generateFactFromBedrock(cached.selectedAnimal);
      this.cache.set(todayKey, cached);
    }

    return {
      animal: cached.selectedAnimal,
      fact: cached.fact,
      date: cached.date,
      expiresAt: cached.expiresAt,
    };
  }

}
