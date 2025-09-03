import { Header } from "@components";
import { GradientBackground } from "@atoms";
import { AuthScreen } from "@containers";

export const HomeView = () => {
  return (
    <GradientBackground>
      <Header />
      <main>
        <AuthScreen />
      </main>
    </GradientBackground>
  );
};
