import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "../../../src/frontend/context/ThemeContext";
import { Header } from "../../../src/frontend/components/layout/Header";

function renderHeader(props = {}) {
  return render(
    <ThemeProvider>
      <HashRouter>
        <Header {...props} />
      </HashRouter>
    </ThemeProvider>
  );
}

describe("Header Component Seam", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders brand badge with title, clicking it triggers navigation to #home", async () => {
    const user = userEvent.setup();
    window.location.hash = "#explore";

    renderHeader();

    const brandLink = screen.getByRole("link", { name: /quantniti/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute("href", "#/home");

    await user.click(brandLink);
    expect(window.location.hash).toBe("#/home");
  });

  it("displays regime pill badge with active regime indicator", () => {
    renderHeader();
    const regimeBadge = screen.getByTestId("regime-pill-badge");
    expect(regimeBadge).toBeInTheDocument();
  });

  it("renders notification bell with unread dot indicator", () => {
    renderHeader();
    const bellBtn = screen.getByTestId("notification-bell-btn");
    expect(bellBtn).toBeInTheDocument();
    const unreadDot = screen.getByTestId("notification-unread-dot");
    expect(unreadDot).toBeInTheDocument();
  });

  it("toggles theme when clicking theme toggle button", async () => {
    const user = userEvent.setup();
    renderHeader();

    const themeBtn = screen.getByTestId("theme-toggle-btn");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    await user.click(themeBtn);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await user.click(themeBtn);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("opens overflow menu containing Compare, Install PWA, and Viewport toggle", async () => {
    const user = userEvent.setup();
    renderHeader();

    const overflowBtn = screen.getByTestId("overflow-menu-btn");
    expect(overflowBtn).toBeInTheDocument();

    // Menu not visible initially
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    // Open menu
    await user.click(overflowBtn);
    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();

    // Verify items
    expect(screen.getByText(/compare vs competitors/i)).toBeInTheDocument();
    expect(screen.getByText(/install pwa/i)).toBeInTheDocument();
    expect(screen.getByText(/toggle viewport/i)).toBeInTheDocument();

    // Close menu when clicking outside or item
    await user.click(screen.getByText(/compare vs competitors/i));
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });
});
