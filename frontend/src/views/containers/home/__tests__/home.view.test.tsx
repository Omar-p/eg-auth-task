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

    // Check if welcome heading is rendered
    const heading = screen.getByRole("heading", {
      name: /welcome to easygenerator/i,
    });
    expect(heading).toBeInTheDocument();

  });

  it("has proper responsive layout classes", () => {
    render(<HomeView />);

    const container = screen.getByRole("main").parentElement;
    expect(container).toHaveClass("min-h-screen", "bg-gray-50");

    const main = screen.getByRole("main");
    expect(main).toHaveClass(
      "max-w-7xl",
      "mx-auto",
      "px-4",
      "sm:px-6",
      "lg:px-8",
      "py-8",
    );
  });
});
