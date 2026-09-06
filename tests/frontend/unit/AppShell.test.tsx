import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../../src/frontend/App";

describe("App Shell Integration Seam", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    window.location.hash = "";
  });

  it("renders mobile-first container constrained to max-w-[520px] on desktop with centered shadow", () => {
    const { container } = render(<App />);
    const shellContainer = container.querySelector(".max-w-\\[520px\\]");
    expect(shellContainer).toBeInTheDocument();
  });

  it("routes to #home by default and renders Home Page placeholder", async () => {
    render(<App />);

    expect(await screen.findByText(/Home Page/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /home/i })).toHaveAttribute("aria-selected", "true");
  });

  it("navigates smoothly across tabs (Explore, Grow, Portfolio) and updates routed views", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Click Explore tab
    await user.click(screen.getByRole("tab", { name: /explore/i }));
    expect(await screen.findByText(/Explore Page/i)).toBeInTheDocument();
    expect(window.location.hash).toContain("explore");

    // Click Grow tab
    await user.click(screen.getByRole("tab", { name: /grow/i }));
    expect(await screen.findByText(/Grow Page/i)).toBeInTheDocument();
    expect(window.location.hash).toContain("grow");

    // Click Portfolio tab
    await user.click(screen.getByRole("tab", { name: /portfolio/i }));
    expect(await screen.findByText(/Portfolio Page/i)).toBeInTheDocument();
    expect(window.location.hash).toContain("portfolio");

    // Click Home tab
    await user.click(screen.getByRole("tab", { name: /home/i }));
    expect(await screen.findByText(/Home Page/i)).toBeInTheDocument();
    expect(window.location.hash).toContain("home");
  });

  it("navigates back to #home when clicking brand logo in header", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to Explore
    await user.click(screen.getByRole("tab", { name: /explore/i }));
    expect(await screen.findByText(/Explore Page/i)).toBeInTheDocument();

    // Click brand logo
    const brandLink = screen.getByRole("link", { name: /quantniti/i });
    await user.click(brandLink);

    expect(await screen.findByText(/Home Page/i)).toBeInTheDocument();
    expect(window.location.hash).toContain("home");
  });
});
