import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "../../../src/frontend/context/ThemeContext";

function ThemeConsumer() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">
        Toggle
      </button>
      <button onClick={() => setTheme("dark")} data-testid="set-dark-btn">
        Set Dark
      </button>
    </div>
  );
}

describe("ThemeProvider & useTheme Seam", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to light theme when no localStorage preference is saved", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-val").textContent).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("quantniti_theme")).toBe("light");
  });

  it("restores saved theme preference from localStorage on mount", () => {
    localStorage.setItem("quantniti_theme", "dark");

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-val").textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("toggles theme between light and dark and updates data-theme and localStorage", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-val").textContent).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    await user.click(screen.getByTestId("toggle-btn"));

    expect(screen.getByTestId("theme-val").textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("quantniti_theme")).toBe("dark");

    await user.click(screen.getByTestId("toggle-btn"));

    expect(screen.getByTestId("theme-val").textContent).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("quantniti_theme")).toBe("light");
  });
});
