import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useLoginMutation,
  useRegisterMutation,
} from "@/hooks/useAuthMutations";
import { useMobile } from "@/hooks";
import {
  signInSchema,
  signUpSchema,
  type SignInFormData,
  type SignUpFormData,
  type AuthMode,
} from "./auth.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@atoms";

// Use Zod schema to validate password requirements
const PasswordRequirements = ({ password }: { password: string }) => {
  const passwordSchema = signUpSchema.shape.password;
  const result = passwordSchema.safeParse(password);

  // Extract which specific validation rules failed
  const failedChecks = result.success
    ? []
    : result.error.issues.map((issue) => issue.message);

  const requirements = [
    {
      text: "At least 8 characters",
      met: !failedChecks.some((msg) => msg.includes("8 characters")),
    },
    {
      text: "Contains a letter",
      met: !failedChecks.some((msg) => msg.includes("letter")),
    },
    {
      text: "Contains a number",
      met: !failedChecks.some((msg) => msg.includes("number")),
    },
    {
      text: "Contains special character",
      met: !failedChecks.some((msg) => msg.includes("special")),
    },
  ];

  return (
    <div className="text-sm bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200/50 mt-3">
      <p className="font-semibold mb-2 text-gray-800">Password requirements:</p>
      <ul className="text-xs space-y-2">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center gap-2 transition-colors duration-200 ${
              req.met ? "text-green-600" : "text-gray-500"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
                req.met
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-500"
              }`}
            >
              {req.met ? "✓" : "○"}
            </span>
            {req.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const AuthView = () => {
  const isMobile = useMobile();
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isSignUp = authMode === "signup";

  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors },
    reset: resetSignIn,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors },
    reset: resetSignUp,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const handleModeToggle = (mode: AuthMode) => {
    setAuthMode(mode);
    setPasswordValue("");
    setShowPassword(false);
    resetSignIn();
    resetSignUp();
  };

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation(() => {
    handleModeToggle("signin");
  });

  const onSignInSubmit = (data: SignInFormData) => {
    loginMutation.mutate(data);
  };

  const onSignUpSubmit = (data: SignUpFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div
      className={`flex items-center justify-center min-h-screen min-w-full overflow-x-hidden ${isMobile ? "px-4 py-6" : "px-4 py-8"}`}
    >
      <div className={`w-full ${isMobile ? "max-w-sm" : "max-w-md"}`}>
        {/* Logo */}
        <div
          className={`flex items-center justify-start ${isMobile ? "mb-8" : "mb-12"}`}
        >
          <div className="flex items-center space-x-4">
            <Logo />
          </div>
        </div>

        {/* Form Card */}
        <Card
          className={`shadow-2xl bg-white/98 backdrop-blur-sm border border-purple-100/50 ${isMobile ? "rounded-2xl" : "rounded-3xl"} overflow-hidden`}
        >
          <CardHeader
            className={`text-center space-y-4 ${isMobile ? "pb-4 pt-6" : "pb-6 pt-8"} bg-gradient-to-br from-blue-50 via-white to-purple-50`}
          >
            <CardTitle
              className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent`}
            >
              {isSignUp ? "Join Our Platform" : "Welcome Back"}
            </CardTitle>
            <CardDescription
              className={`${isMobile ? "text-base" : "text-lg"} text-gray-600`}
            >
              {isSignUp
                ? "Create your account to get started"
                : "Sign in to continue your journey"}
            </CardDescription>
          </CardHeader>

          <CardContent
            className={`space-y-6 ${isMobile ? "px-6 pb-6" : "px-8 pb-8"} bg-white`}
          >
            {isSignUp ? (
              // Sign Up Form
              <form
                onSubmit={handleSignUpSubmit(onSignUpSubmit)}
                className={isMobile ? "space-y-4" : "space-y-6"}
              >
                {/* Name Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-gray-700 font-medium text-sm"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    {...registerSignUp("name")}
                    placeholder="Enter your full name"
                    className={`h-12 px-4 text-base rounded-xl border-2 transition-all duration-300 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary bg-gray-50 focus:bg-white ${signUpErrors.name ? "border-red-400 focus:border-red-500" : "border-gray-200 hover:border-gray-300"}`}
                  />
                  {signUpErrors.name && (
                    <p className="text-sm text-red-600 flex items-center gap-2 mt-2">
                      <span>⚠️</span> {signUpErrors.name.message}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-email"
                    className="text-gray-700 font-medium text-sm"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    {...registerSignUp("email")}
                    placeholder="Enter your email address"
                    className={`h-12 px-4 text-base rounded-xl border-2 transition-all duration-300 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary bg-gray-50 focus:bg-white ${signUpErrors.email ? "border-red-400 focus:border-red-500" : "border-gray-200 hover:border-gray-300"}`}
                  />
                  {signUpErrors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-2 mt-2">
                      <span>⚠️</span> {signUpErrors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-password"
                    className="text-gray-700 font-medium text-sm"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      {...registerSignUp("password", {
                        onChange: (e) => setPasswordValue(e.target.value),
                      })}
                      placeholder="Create a strong password"
                      className={`h-12 px-4 pr-12 text-base rounded-xl border-2 transition-all duration-300 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary bg-gray-50 focus:bg-white ${signUpErrors.password ? "border-red-400 focus:border-red-500" : "border-gray-200 hover:border-gray-300"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <span className="text-lg">👁️</span>
                      ) : (
                        <span className="text-lg">👁️‍🗨️</span>
                      )}
                    </button>
                  </div>
                  {signUpErrors.password && (
                    <p className="text-sm text-red-600 flex items-center gap-2 mt-2">
                      <span>⚠️</span> {signUpErrors.password.message}
                    </p>
                  )}
                  <PasswordRequirements password={passwordValue} />
                </div>

                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className={`w-full ${isMobile ? "h-12" : "h-14"} bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent hover:from-brand-secondary hover:to-brand-coral text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] ${isMobile ? "mt-6" : "mt-8"} ${isMobile ? "text-base" : "text-lg"}`}
                >
                  {registerMutation.isPending
                    ? "Creating Account..."
                    : "Create Account 🚀"}
                </Button>

                <div className="text-center text-sm text-gray-600 mt-6">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeToggle("signin")}
                    className="text-brand-primary hover:text-brand-secondary font-semibold hover:underline transition-all duration-200"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            ) : (
              // Sign In Form
              <form
                onSubmit={handleSignInSubmit(onSignInSubmit)}
                className={isMobile ? "space-y-4" : "space-y-6"}
              >
                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="signin-email"
                    className="text-gray-700 font-medium text-sm"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    {...registerSignIn("email")}
                    placeholder="you@example.com"
                    className={`h-12 px-4 text-base rounded-xl border-2 transition-all duration-300 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary bg-gray-50 focus:bg-white ${signInErrors.email ? "border-red-400 focus:border-red-500" : "border-gray-200 hover:border-gray-300"}`}
                  />
                  {signInErrors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-2 mt-2">
                      <span>⚠️</span> {signInErrors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="signin-password"
                    className="text-gray-700 font-medium text-sm"
                  >
                    Password
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    {...registerSignIn("password")}
                    placeholder="••••••••"
                    className={`h-12 px-4 text-base rounded-xl border-2 transition-all duration-300 focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary bg-gray-50 focus:bg-white ${signInErrors.password ? "border-red-400 focus:border-red-500" : "border-gray-200 hover:border-gray-300"}`}
                  />
                  {signInErrors.password && (
                    <p className="text-sm text-red-600 flex items-center gap-2 mt-2">
                      <span>⚠️</span> {signInErrors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className={`w-full ${isMobile ? "h-12" : "h-14"} bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent hover:from-brand-secondary hover:to-brand-coral text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] ${isMobile ? "mt-6" : "mt-8"} ${isMobile ? "text-base" : "text-lg"}`}
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In ✨"}
                </Button>

                <div className="text-center text-sm text-gray-600 mt-6">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeToggle("signup")}
                    className="text-brand-primary hover:text-brand-secondary font-semibold hover:underline transition-all duration-200"
                  >
                    Sign up
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
