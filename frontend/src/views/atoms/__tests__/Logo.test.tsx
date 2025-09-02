import { render, screen } from "@testing-library/react";
import { Logo } from "@atoms";

describe("Logo", () => {
  it("renders with default props", () => {
    render(<Logo />);
    const logo = screen.getByAltText("Easygenerator logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass("h-6", "w-auto", "sm:h-8");
  });

  it("renders with custom alt text", () => {
    render(<Logo alt="Custom logo alt text" />);
    const logo = screen.getByAltText("Custom logo alt text");
    expect(logo).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Logo className="custom-class" />);
    const logo = screen.getByAltText("Easygenerator logo");
    expect(logo).toHaveClass("custom-class");
  });
});
