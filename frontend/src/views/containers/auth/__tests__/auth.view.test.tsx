import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthView } from "../auth.view";
import { signUpSchema } from "../auth.types";
import { TestWrapper } from "@/test-utils/test-wrapper";

describe("AuthView", () => {
  it("renders sign-in form by default", () => {
    render(
      <TestWrapper>
        <AuthView />
      </TestWrapper>,
    );
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(
      screen.getByText("Sign in to continue your journey"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("toggles to sign-up form", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <AuthView />
      </TestWrapper>,
    );

    const signUpButton = screen.getByRole("button", { name: /sign up/i });
    await user.click(signUpButton);

    expect(screen.getByText("Join Our Platform")).toBeInTheDocument();
    expect(
      screen.getByText("Create your account to get started"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("toggles back to sign-in form from sign-up", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <AuthView />
      </TestWrapper>,
    );

    // Switch to sign-up
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    expect(screen.getByText("Join Our Platform")).toBeInTheDocument();

    // Switch back to sign-in
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
  });

  describe("Password validation", () => {
    it("shows password requirements in sign-up mode", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthView />
        </TestWrapper>,
      );

      await user.click(screen.getByRole("button", { name: /sign up/i }));

      expect(screen.getByText("Password requirements:")).toBeInTheDocument();
      expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
      expect(screen.getByText("Contains a letter")).toBeInTheDocument();
      expect(screen.getByText("Contains a number")).toBeInTheDocument();
      expect(
        screen.getByText("Contains special character"),
      ).toBeInTheDocument();
    });

    it("updates password requirements as user types", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthView />
        </TestWrapper>,
      );

      await user.click(screen.getByRole("button", { name: /sign up/i }));

      const passwordInput = screen.getByPlaceholderText(
        "Create a strong password",
      );

      // Type a password that meets length requirement
      await user.type(passwordInput, "password");

      await waitFor(() => {
        const lengthRequirement = screen
          .getByText("At least 8 characters")
          .closest("li");
        expect(lengthRequirement).toHaveClass("text-green-600");
      });

      // Add number and special character
      await user.type(passwordInput, "123!");

      await waitFor(() => {
        const numberRequirement = screen
          .getByText("Contains a number")
          .closest("li");
        const specialRequirement = screen
          .getByText("Contains special character")
          .closest("li");
        expect(numberRequirement).toHaveClass("text-green-600");
        expect(specialRequirement).toHaveClass("text-green-600");
      });
    });

    it("clears password state when toggling forms", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthView />
        </TestWrapper>,
      );

      // Switch to sign-up and type password
      await user.click(screen.getByRole("button", { name: /sign up/i }));
      const passwordInput = screen.getByPlaceholderText(
        "Create a strong password",
      );
      await user.type(passwordInput, "password123!");

      // Verify password requirements are updated
      await waitFor(() => {
        const lengthRequirement = screen
          .getByText("At least 8 characters")
          .closest("li");
        expect(lengthRequirement).toHaveClass("text-green-600");
      });

      // Switch back to sign-in
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Switch back to sign-up
      await user.click(screen.getByRole("button", { name: /sign up/i }));

      // Password field should be empty and requirements reset
      const newPasswordInput = screen.getByPlaceholderText(
        "Create a strong password",
      );
      expect(newPasswordInput).toHaveValue("");

      await waitFor(() => {
        const lengthRequirement = screen
          .getByText("At least 8 characters")
          .closest("li");
        expect(lengthRequirement).toHaveClass("text-gray-500");
      });
    });
  });

  describe("Password visibility toggle", () => {
    it("toggles password visibility in sign-up form", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthView />
        </TestWrapper>,
      );

      await user.click(screen.getByRole("button", { name: /sign up/i }));

      const passwordInput = screen.getByPlaceholderText(
        "Create a strong password",
      );
      const toggleButton = screen.getByRole("button", { name: "👁️‍🗨️" });

      expect(passwordInput).toHaveAttribute("type", "password");

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "text");

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("resets password visibility when toggling forms", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthView />
        </TestWrapper>,
      );

      // Switch to sign-up and show password
      await user.click(screen.getByRole("button", { name: /sign up/i }));
      const toggleButton = screen.getByRole("button", { name: "👁️‍🗨️" });
      await user.click(toggleButton);

      let passwordInput = screen.getByPlaceholderText(
        "Create a strong password",
      );
      expect(passwordInput).toHaveAttribute("type", "text");

      // Switch to sign-in and back to sign-up
      await user.click(screen.getByRole("button", { name: /sign in/i }));
      await user.click(screen.getByRole("button", { name: /sign up/i }));

      // Password should be hidden again
      passwordInput = screen.getByPlaceholderText("Create a strong password");
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("ensures Zod password requirements match interactive requirements count", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthView />
        </TestWrapper>,
      );

      await user.click(screen.getByRole("button", { name: /sign up/i }));

      // Count the interactive requirements shown to user
      const requirementsList = screen.getByText("Password requirements:")
        .nextSibling as Element;
      const interactiveRequirements = requirementsList?.querySelectorAll("li");

      // Get password validation rules count from Zod schema
      const passwordSchema = signUpSchema.shape.password;
      const testResult = passwordSchema.safeParse("");
      const zodRequirementsCount = testResult.success
        ? 0
        : testResult.error.issues.length;

      expect(interactiveRequirements).toHaveLength(zodRequirementsCount);

      // Verify the specific requirements match Zod schema
      expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
      expect(screen.getByText("Contains a letter")).toBeInTheDocument();
      expect(screen.getByText("Contains a number")).toBeInTheDocument();
      expect(
        screen.getByText("Contains special character"),
      ).toBeInTheDocument();

      // Test that invalid password triggers all requirements
      const passwordInput = screen.getByPlaceholderText(
        "Create a strong password",
      );
      await user.type(passwordInput, "abc"); // Short password without number/special char

      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        // Should show Zod error message
        expect(
          screen.getByText("Password must be at least 8 characters long"),
        ).toBeInTheDocument();
      });

      // Clear and test valid password meets all requirements
      await user.clear(passwordInput);
      await user.type(passwordInput, "ValidPass123!");

      await waitFor(() => {
        const requirements = screen.getAllByText(/Contains|At least/);
        requirements.forEach((req) => {
          const listItem = req.closest("li");
          expect(listItem).toHaveClass("text-green-600");
        });
      });
    });
  });

  describe("Form validation", () => {
    it("shows validation errors for empty sign-in form", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthView />
        </TestWrapper>,
      );

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Please enter a valid email address"),
        ).toBeInTheDocument();
        expect(screen.getByText("Password is required")).toBeInTheDocument();
      });
    });

    it("shows validation errors for empty sign-up form", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <AuthView />
        </TestWrapper>,
      );

      await user.click(screen.getByRole("button", { name: /sign up/i }));

      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Name must be at least 3 characters long"),
        ).toBeInTheDocument();
        expect(
          screen.getByText("Please enter a valid email address"),
        ).toBeInTheDocument();
        expect(
          screen.getByText("Password must be at least 8 characters long"),
        ).toBeInTheDocument();
      });
    });
  });
});
