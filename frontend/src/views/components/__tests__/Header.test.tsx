import { render, screen } from "@testing-library/react";
import { Header } from "../Header";
import { TestWrapper } from "@/test-utils/test-wrapper";

describe("Header", () => {
  it("renders the header with logo", () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>,
    );

    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();

    const logo = screen.getByAltText("Easygenerator logo");
    expect(logo).toBeInTheDocument();
  });

  it("has sticky positioning classes", () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>,
    );
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("fixed", "top-0", "left-0", "right-0", "z-50");
  });

  it("has proper backdrop styling", () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>,
    );
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("backdrop-blur-md", "bg-white/90");
  });

  it("applies custom className", () => {
    render(
      <TestWrapper>
        <Header className="custom-header-class" />
      </TestWrapper>,
    );
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("custom-header-class");
  });

  it("has responsive height classes", () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>,
    );
    const headerContent = screen.getByRole("banner").querySelector("div > div");
    expect(headerContent).toHaveClass("h-16", "sm:h-20");
  });
});
