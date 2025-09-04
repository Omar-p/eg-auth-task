interface GradientBackgroundProps {
  children: React.ReactNode;
}

export const GradientBackground = ({ children }: GradientBackgroundProps) => {
  return (
    <div className="relative min-h-screen min-w-full w-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pt-16 sm:pt-20 overflow-x-hidden">
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-orange-200/30 to-red-200/20 rounded-full animate-pulse"></div>
      <div
        className="absolute top-1/3 right-10 w-96 h-96 bg-gradient-to-br from-red-200/20 to-orange-200/30 rounded-full animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-10 left-1/3 w-80 h-80 bg-gradient-to-br from-orange-100/40 to-red-100/30 rounded-full animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="relative z-10">{children}</div>
    </div>
  );
};
