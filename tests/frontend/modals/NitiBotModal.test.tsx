import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NitiBotModal } from "../../../src/frontend/components/modals/NitiBotModal";

describe("NitiBotModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders welcome message, suggestion chips, and online status", () => {
    render(<NitiBotModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText("NitiBot AI")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByText(/Hello! I am NitiBot/i)).toBeInTheDocument();
    expect(screen.getByText("What is our active market regime?")).toBeInTheDocument();
  });

  it("disables send button when input is empty or while awaiting response", async () => {
    // Mock fetch
    global.fetch = vi.fn().mockImplementation(() =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: async () => ({
                reply: "Market is currently Bull Trending with 14% volatility.",
                sources: ["NIFTY 50 Daily", "QuantNiti Regime Engine"],
                session_id: "test-sess",
              }),
            }),
          100
        )
      )
    );

    render(<NitiBotModal isOpen={true} onClose={() => {}} />);

    const sendBtn = screen.getByLabelText("Send message");
    expect(sendBtn).toBeDisabled();

    // Type input
    const input = screen.getByPlaceholderText(/Ask about regimes/i);
    fireEvent.change(input, { target: { value: "Tell me about my risk" } });
    expect(sendBtn).not.toBeDisabled();

    fireEvent.click(sendBtn);

    // User message should appear immediately
    expect(screen.getByText("Tell me about my risk")).toBeInTheDocument();

    // Button disabled during await
    expect(sendBtn).toBeDisabled();

    // Bot response appears with citations
    await waitFor(() => {
      expect(
        screen.getByText("Market is currently Bull Trending with 14% volatility.")
      ).toBeInTheDocument();
      expect(screen.getByText("NIFTY 50 Daily")).toBeInTheDocument();
    });
  });
});
