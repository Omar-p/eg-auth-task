import { authAPI } from "./auth-api";

export interface AnimalFact {
  animal: string;
  fact: string;
  date: string;
  expiresAt: string;
}

class AnimalFactsAPI {
  async getDailyAnimalFact(): Promise<AnimalFact> {
    return authAPI.request<AnimalFact>("/animal-facts", {
      method: "GET",
    });
  }
}

export const animalFactsAPI = new AnimalFactsAPI();
