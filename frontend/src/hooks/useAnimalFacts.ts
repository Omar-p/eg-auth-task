import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { animalFactsAPI, type AnimalFact } from "@/services/animal-facts-api";

export const useAnimalFacts = () => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  const {
    data: animalFact,
    isLoading,
    error,
    refetch,
  } = useQuery<AnimalFact>({
    queryKey: ["animalFacts"],
    queryFn: () => animalFactsAPI.getDailyAnimalFact(),
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchInterval: 1000 * 60 * 60, // Check every hour for updates
  });

  useEffect(() => {
    if (!animalFact?.expiresAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expireTime = new Date(animalFact.expiresAt).getTime();
      const difference = expireTime - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60),
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft(
          `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
        );
      } else {
        setTimeLeft("00:00:00");
        // Refetch when expired
        refetch();
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [animalFact?.expiresAt, refetch]);

  return {
    animalFact,
    isLoading,
    error,
    timeLeft,
    refetch,
  };
};
