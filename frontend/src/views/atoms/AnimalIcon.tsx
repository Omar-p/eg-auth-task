interface AnimalIconProps {
  animal: string;
  size?: "sm" | "md" | "lg";
}

const getAnimalEmoji = (animal: string): string => {
  const animalMap: Record<string, string> = {
    lion: "🦁",
    tiger: "🐅",
    elephant: "🐘",
    giraffe: "🦒",
    penguin: "🐧",
    octopus: "🐙",
    dolphin: "🐬",
    eagle: "🦅",
    kangaroo: "🦘",
    panda: "🐼",
    default: "🐾",
  };

  return animalMap[animal.toLowerCase()] || animalMap.default;
};

const sizeClasses = {
  sm: "text-2xl w-8 h-8",
  md: "text-3xl w-12 h-12",
  lg: "text-4xl w-16 h-16",
};

export const AnimalIcon = ({ animal, size = "md" }: AnimalIconProps) => {
  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-r from-green-100 to-blue-100`}
    >
      <span>{getAnimalEmoji(animal)}</span>
    </div>
  );
};
