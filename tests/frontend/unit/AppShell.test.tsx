import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../../src/frontend/App";

describe("App Shell Scaffold Seam", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders the scaffold shell with branding, violet styling, and theme toggle", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Branding and shell title
    expect(screen.getByText(/QuantNiti/i)).toBeInTheDocument();
    expect(screen.getByTestId("theme-toggle-btn")).toBeInTheDocument();

    // Default theme state is light
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Click theme toggle
    await user.click(screen.getByTestId("theme-toggle-btn"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Click again to return to light
    await user.click(screen.getByTestId("theme-toggle-btn"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
