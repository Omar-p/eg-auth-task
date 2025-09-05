interface CountdownTimerProps {
  timeLeft: string;
  label?: string;
}

export const CountdownTimer = ({
  timeLeft,
  label = "New fact in:",
}: CountdownTimerProps) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-full">
      <span className="text-blue-600">⏰</span>
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-mono text-sm font-semibold text-blue-700">
        {timeLeft}
      </span>
    </div>
  );
};
