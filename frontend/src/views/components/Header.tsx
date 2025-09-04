import { Logo } from "@atoms";
import { useAuth } from "@/contexts/auth.types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HeaderProps {
  className?: string;
}

export const Header = ({ className = "" }: HeaderProps) => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully", {
      description: "You have been logged out. See you next time!",
    });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome, {user?.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
