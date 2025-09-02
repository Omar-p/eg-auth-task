import { Header } from "@components";

export const HomeView = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Welcome to Easygenerator
          </h1>
        </div>
      </main>
    </div>
  );
};
