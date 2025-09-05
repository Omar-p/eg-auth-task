import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnimalFactsService } from './animal-facts.service';
import { AnimalFact } from './interfaces/animal-fact.interface';

@ApiTags('/api/animal-facts')
@Controller('/api/animal-facts')
export class AnimalFactsController {
  constructor(private readonly animalFactsService: AnimalFactsService) {}

  @Get()
  @ApiOperation({ summary: 'Get daily animal fact' })
  @ApiResponse({
    status: 200,
    description: 'Returns the daily animal fact',
    schema: {
      type: 'object',
      properties: {
        animal: { type: 'string', example: 'Lion' },
        fact: { type: 'string', example: 'Lions can run up to 50 mph in short bursts.' },
        date: { type: 'string', example: '2024-01-15' },
        expiresAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getDailyFact(): Promise<AnimalFact> {
    return this.animalFactsService.getDailyAnimalFact();
  }

}
