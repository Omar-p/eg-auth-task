import { useAuth } from "@/contexts/auth.types";

export const WelcomeView = () => {
  const { user } = useAuth();

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

            {/* Additional Content */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                What's Next?
              </h2>
              <p className="text-gray-600 text-sm">
                This is your dashboard area. Here you can access all the
                features and functionality of our platform. Start exploring and
                make the most of your experience!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
