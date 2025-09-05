import { Module } from '@nestjs/common';
import { AnimalFactsService } from './animal-facts.service';
import { AnimalFactsController } from './animal-facts.controller';

@Module({
  providers: [AnimalFactsService],
  controllers: [AnimalFactsController],
  exports: [AnimalFactsService],
})
export class AnimalFactsModule {}