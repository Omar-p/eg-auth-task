import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth.types";
import { authAPI } from "@/services/auth-api";
import type {
  SignInFormData,
  SignUpFormData,
} from "@/views/containers/auth/auth.types";
import { toast } from "sonner";

export const useLoginMutation = () => {
  const { setTokens } = useAuth();

  return useMutation({
    mutationFn: (credentials: SignInFormData) => authAPI.login(credentials),
    onSuccess: (response) => {
      localStorage.setItem("user_data", JSON.stringify(response.user));
      setTokens({
        access_token: response.access_token,
      });

      toast.success("Welcome back!", {
        description: "You have been successfully signed in.",
        duration: 4000,
      });
    },
    onError: (error: Error) => {
      toast.error("Sign in failed", {
        description:
          error.message || "Please check your credentials and try again.",
      });
    },
  });
};

export const useRegisterMutation = (onSuccess?: () => void) => {
  return useMutation({
    mutationFn: (data: SignUpFormData) => authAPI.register(data),
    onSuccess: () => {
      toast.success("Account created successfully!", {
        description: "Please sign in with your new account credentials.",
        duration: 5000,
      });

      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error("Registration failed", {
        description:
          error.message || "Please check your information and try again.",
      });
    },
  });
};
