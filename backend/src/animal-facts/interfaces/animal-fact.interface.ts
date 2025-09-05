export interface AnimalFact {
  animal: string;
  fact: string;
  date: string;
  expiresAt: Date;
}

export interface DailyAnimalCache {
  selectedAnimal: string;
  fact?: string;
  date: string;
  expiresAt: Date;
}