import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { useMobile } from "@/hooks";

// Mock window.matchMedia
const mockMatchMedia = vi.fn();

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: mockMatchMedia,
});

// Mock window.innerWidth
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 1024,
});

describe("useMobile", () => {
  beforeEach(() => {
    mockMatchMedia.mockClear();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it("should return false for desktop width by default", () => {
    // Set desktop width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useMobile());

    expect(result.current).toBe(false);
  });

  it("should return true for mobile width", () => {
    // Set mobile width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 600,
    });

    const { result } = renderHook(() => useMobile());

    expect(result.current).toBe(true);
  });

  it("should set up media query listener", () => {
    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();

    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    });

    const { unmount } = renderHook(() => useMobile());

    expect(mockMatchMedia).toHaveBeenCalledWith("(max-width: 767px)");
    expect(mockAddEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("should handle environment without matchMedia", () => {
    // Temporarily remove matchMedia
    const originalMatchMedia = window.matchMedia;
    delete (window as Window & { matchMedia?: unknown }).matchMedia;

    const { result } = renderHook(() => useMobile());

    // Should default to false and not crash
    expect(result.current).toBe(false);

    // Restore matchMedia
    window.matchMedia = originalMatchMedia;
  });
});
