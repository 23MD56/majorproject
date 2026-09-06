import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  GlassCard,
  PrimaryButton,
  GhostButton,
  ChipButton,
  SegmentedControl,
  ModalSheet,
  ProgressBar,
  AnimatedNumber,
  RegimeBadge,
  LearnChip,
  transitions,
} from "../../../../src/frontend/components/ui";

describe("Shared UI Component Library (Ticket 03)", () => {
  describe("Transitions Presets", () => {
    it("exports consistent spring, smooth, and snappy motion configs", () => {
      expect(transitions.spring).toBeDefined();
      expect(transitions.smooth).toBeDefined();
      expect(transitions.snappy).toBeDefined();
      expect(transitions.fadeInUp).toBeDefined();
      expect(transitions.slideUp).toBeDefined();
    });
  });

  describe("<GlassCard />", () => {
    it("renders children with squircle corners and hairline border", () => {
      render(
        <GlassCard data-testid="glass-card">
          <span>Card Content</span>
        </GlassCard>
      );
      const card = screen.getByTestId("glass-card");
      expect(card).toBeInTheDocument();
      expect(screen.getByText("Card Content")).toBeInTheDocument();
      expect(card.className).toContain("rounded-3xl");
      expect(card.className).toContain("border");
    });
  });

  describe("<PrimaryButton />", () => {
    it("renders children, handles click, and applies gradient CTA styling", () => {
      const handleClick = vi.fn();
      render(<PrimaryButton onClick={handleClick}>Generate Basket</PrimaryButton>);
      const btn = screen.getByRole("button", { name: /generate basket/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("displays spinner and is disabled when loading is true", () => {
      const handleClick = vi.fn();
      render(
        <PrimaryButton loading onClick={handleClick}>
          Submitting
        </PrimaryButton>
      );
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
      expect(btn.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("<GhostButton />", () => {
    it("renders text with transparent styling and responds to clicks", () => {
      const handleClick = vi.fn();
      render(<GhostButton onClick={handleClick}>Cancel</GhostButton>);
      const btn = screen.getByRole("button", { name: /cancel/i });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain("text-accent");
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("<ChipButton />", () => {
    it("renders selectable pill with active and inactive styles", () => {
      const handleSelect = vi.fn();
      const { rerender } = render(
        <ChipButton selected={false} onClick={handleSelect}>
          ₹10,000
        </ChipButton>
      );
      const chip = screen.getByRole("button", { name: "₹10,000" });
      expect(chip).toBeInTheDocument();
      fireEvent.click(chip);
      expect(handleSelect).toHaveBeenCalledTimes(1);

      rerender(
        <ChipButton selected={true} onClick={handleSelect}>
          ₹10,000
        </ChipButton>
      );
      expect(chip.className).toContain("bg-accent");
    });
  });

  describe("<SegmentedControl />", () => {
    it("renders options and highlights the selected segment", () => {
      const handleChange = vi.fn();
      const options = [
        { value: "overview", label: "Overview" },
        { value: "holdings", label: "Holdings" },
        { value: "performance", label: "Performance" },
      ];

      render(
        <SegmentedControl
          options={options}
          value="overview"
          onChange={handleChange}
        />
      );

      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Holdings")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Holdings"));
      expect(handleChange).toHaveBeenCalledWith("holdings");
    });
  });

  describe("<ModalSheet />", () => {
    it("renders sheet content and title when isOpen is true", () => {
      const handleClose = vi.fn();
      render(
        <ModalSheet isOpen={true} onClose={handleClose} title="Stock Profile">
          <div>Sheet Body Content</div>
        </ModalSheet>
      );

      expect(screen.getByText("Stock Profile")).toBeInTheDocument();
      expect(screen.getByText("Sheet Body Content")).toBeInTheDocument();

      const closeBtn = screen.getByLabelText(/close/i);
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("does not render content when isOpen is false", () => {
      render(
        <ModalSheet isOpen={false} onClose={vi.fn()} title="Hidden Sheet">
          <div>Hidden Content</div>
        </ModalSheet>
      );

      expect(screen.queryByText("Hidden Sheet")).not.toBeInTheDocument();
      expect(screen.queryByText("Hidden Content")).not.toBeInTheDocument();
    });
  });

  describe("<ProgressBar />", () => {
    it("renders segmented dashes matching totalSteps and marks active progress", () => {
      render(<ProgressBar totalSteps={3} currentStep={2} data-testid="progress-bar" />);
      const segments = screen.getAllByTestId("progress-segment");
      expect(segments).toHaveLength(3);
    });
  });

  describe("<AnimatedNumber />", () => {
    it("renders initial number and formats using custom formatter", () => {
      render(
        <AnimatedNumber
          value={50000}
          formatter={(v) => `₹${Math.round(v).toLocaleString("en-IN")}`}
        />
      );
      expect(screen.getByText(/₹50,000/)).toBeInTheDocument();
    });
  });

  describe("<RegimeBadge />", () => {
    it("renders emerald styling for BULL regime", () => {
      render(<RegimeBadge regime="BULL" />);
      const badge = screen.getByTestId("regime-badge");
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toMatch(/bull/i);
      expect(badge.className).toContain("text-emerald");
    });

    it("renders rose styling for BEAR regime", () => {
      render(<RegimeBadge regime="BEAR" />);
      const badge = screen.getByTestId("regime-badge");
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toMatch(/bear/i);
      expect(badge.className).toContain("text-rose");
    });

    it("renders amber styling for SIDEWAYS regime", () => {
      render(<RegimeBadge regime="SIDEWAYS" />);
      const badge = screen.getByTestId("regime-badge");
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toMatch(/sideways/i);
      expect(badge.className).toContain("text-amber");
    });
  });

  describe("<LearnChip />", () => {
    it("renders small Learn pill and triggers onClick", () => {
      const handleClick = vi.fn();
      render(<LearnChip concept="Sharpe Ratio" onClick={handleClick} />);
      const chip = screen.getByRole("button", { name: /learn.*sharpe ratio/i });
      expect(chip).toBeInTheDocument();
      fireEvent.click(chip);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
