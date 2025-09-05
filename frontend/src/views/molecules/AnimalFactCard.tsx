import { AnimalIcon, CountdownTimer } from "@atoms";
import type { AnimalFact } from "@/services/animal-facts-api";

interface AnimalFactCardProps {
  animalFact?: AnimalFact;
  timeLeft: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const AnimalFactCard = ({
  animalFact,
  timeLeft,
  isLoading = false,
  onRefresh,
}: AnimalFactCardProps) => {
  if (isLoading || !animalFact) {
    return (
      <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200/50">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
        <p className="text-center text-gray-600 mt-2">
          Loading today's animal fact...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AnimalIcon animal={animalFact.animal} size="md" />
          <h3 className="text-lg font-semibold text-gray-800">
            Daily Animal Fact
          </h3>
        </div>
        <CountdownTimer timeLeft={timeLeft} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Animal:</span>
          <span className="text-sm text-gray-600">{animalFact.animal}</span>
        </div>

        <div className="p-4 bg-white/70 rounded-lg border border-green-100">
          <p className="text-gray-700 text-sm leading-relaxed">
            {animalFact.fact}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Updated:{" "}
            {new Date(animalFact.date + "T00:00:00").toLocaleDateString()}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Refresh
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
