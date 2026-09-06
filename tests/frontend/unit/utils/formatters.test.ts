import { describe, it, expect } from "vitest";
import {
  numberToIndianWords,
  formatRupees,
  formatCompactRupees,
} from "../../../../src/frontend/utils/formatters";

describe("Rupee Formatters Seam", () => {
  describe("formatRupees", () => {
    it("formats amounts in Indian comma notation with Rupee symbol", () => {
      expect(formatRupees(50000)).toBe("₹50,000");
      expect(formatRupees(100000)).toBe("₹1,00,000");
      expect(formatRupees(1250000)).toBe("₹12,50,000");
      expect(formatRupees(0)).toBe("₹0");
    });
  });

  describe("formatCompactRupees", () => {
    it("formats compact quick-pick labels", () => {
      expect(formatCompactRupees(10000)).toBe("₹10k");
      expect(formatCompactRupees(25000)).toBe("₹25k");
      expect(formatCompactRupees(50000)).toBe("₹50k");
      expect(formatCompactRupees(100000)).toBe("₹1L");
      expect(formatCompactRupees(500000)).toBe("₹5L");
    });
  });

  describe("numberToIndianWords", () => {
    it("converts numbers to Indian English words with 'Only' suffix", () => {
      expect(numberToIndianWords(10000)).toBe("Ten Thousand Only");
      expect(numberToIndianWords(25000)).toBe("Twenty Five Thousand Only");
      expect(numberToIndianWords(50000)).toBe("Fifty Thousand Only");
      expect(numberToIndianWords(75000)).toBe("Seventy Five Thousand Only");
      expect(numberToIndianWords(100000)).toBe("One Lakh Only");
      expect(numberToIndianWords(500000)).toBe("Five Lakhs Only");
      expect(numberToIndianWords(1000000)).toBe("Ten Lakhs Only");
    });

    it("handles zero gracefully", () => {
      expect(numberToIndianWords(0)).toBe("Zero Only");
    });
  });
});
