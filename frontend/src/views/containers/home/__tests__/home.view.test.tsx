import { render, screen } from "@testing-library/react";
import { HomeView } from "../home.view";

describe("HomeView", () => {
  it("renders the home view with header and main content", () => {
    render(<HomeView />);

    // Check if header is rendered
    const header = screen.getByRole("banner");

    expect(header).toBeInTheDocument();

    // Check if main content is rendered
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();

    // Check if auth form heading is rendered (Welcome Back for sign in)
    const heading = screen.getByRole("heading", {
      name: /welcome back/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it("has animated background and proper layout", () => {
    render(<HomeView />);

    // Check if the animated background container exists
    const animatedBg = screen.getByRole("main").parentElement?.parentElement;
    expect(animatedBg).toHaveClass(
      "relative",
      "min-h-screen",
      "bg-gradient-to-br",
      "from-orange-50",
      "via-white",
      "to-red-50",
      "pt-16",
      "sm:pt-20",
    );
  });
});
