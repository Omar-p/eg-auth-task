import { useAuth } from "@/contexts/auth.types";
import { useAnimalFacts } from "@/hooks/useAnimalFacts";
import { AnimalFactCard } from "@molecules";

export const WelcomeView = () => {
  const { user } = useAuth();
  const { animalFact, isLoading, timeLeft, refetch } = useAnimalFacts();

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <div className="w-full max-w-2xl text-center">
        <div className="bg-white/95 backdrop-blur-sm border border-purple-100/50 rounded-3xl shadow-2xl p-12">
          <div className="space-y-6">
            {/* Welcome Icon */}
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent rounded-full flex items-center justify-center">
              <span className="text-4xl text-white">👋</span>
            </div>

            {/* Welcome Message */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
                Welcome to Our Platform!
              </h1>
              <p className="text-xl text-gray-600">
                Hi {user?.name}! You have successfully signed in.
              </p>
              <p className="text-base text-gray-500">
                Your email:{" "}
                <span className="font-medium text-gray-700">{user?.email}</span>
              </p>
            </div>

            {/* Success Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 border border-green-200 rounded-full">
              <span className="text-green-600">✓</span>
              <span className="text-green-700 font-medium">
                Authentication Successful
              </span>
            </div>

            {/* Daily Animal Fact */}
            <div className="mt-8">
              {animalFact ? (
                <AnimalFactCard
                  animalFact={animalFact}
                  timeLeft={timeLeft}
                  isLoading={false}
                  onRefresh={refetch}
                />
              ) : (
                <AnimalFactCard
                  animalFact={{
                    animal: "Loading",
                    fact: "Loading your daily animal fact...",
                    date: new Date().toISOString().split("T")[0],
                    expiresAt: new Date().toISOString(),
                  }}
                  timeLeft="--:--:--"
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
