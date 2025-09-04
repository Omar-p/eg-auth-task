import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/auth.types";
import { queryClient } from "@/lib/query-client";
import { HomeScreen, WelcomeView } from "@containers";
import { GradientBackground } from "@atoms";
import { Header } from "@components";
import { Toaster } from "@/components/ui/sonner";

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <GradientBackground>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </GradientBackground>
    );
  }

  if (isAuthenticated) {
    return (
      <GradientBackground>
        <Header />
        <main>
          <WelcomeView />
        </main>
      </GradientBackground>
    );
  }

  return <HomeScreen />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
