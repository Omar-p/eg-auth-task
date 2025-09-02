import { render, screen } from "@testing-library/react";
import { Header } from "../Header";

describe("Header", () => {
  it("renders the header with logo", () => {
    render(<Header />);

    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();

    const logo = screen.getByAltText("Easygenerator logo");
    expect(logo).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Header className="custom-header-class" />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("custom-header-class");
  });

  it("has responsive height classes", () => {
    render(<Header />);
    const headerContent = screen
      .getByRole("banner")
      .querySelector("div div div");
    expect(headerContent).toHaveClass("h-14", "sm:h-16");
  });
});
