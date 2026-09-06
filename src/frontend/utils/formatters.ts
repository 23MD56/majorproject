/**
 * Formats a number as an Indian Rupee string (e.g. 50000 -> "₹50,000")
 */
export function formatRupees(amount: number, maximumFractionDigits: number = 0): string {
  if (isNaN(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits,
  })}`;
}

/**
 * Formats a number as a compact quick-pick label (e.g. 10000 -> "₹10k", 100000 -> "₹1L")
 */
export function formatCompactRupees(amount: number): string {
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(1)}L`;
  }
  if (amount >= 1000) {
    const thousands = amount / 1000;
    return `₹${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`;
  }
  return formatRupees(amount);
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigits(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o === 0 ? TENS[t] : `${TENS[t]} ${ONES[o]}`;
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h === 0) return twoDigits(rem);
  if (rem === 0) return `${ONES[h]} Hundred`;
  return `${ONES[h]} Hundred ${twoDigits(rem)}`;
}

/**
 * Converts a number to Indian numbering words (Crore, Lakh, Thousand) with "Only" suffix
 */
export function numberToIndianWords(amount: number): string {
  const n = Math.floor(Math.abs(amount));
  if (n === 0) return "Zero Only";

  let words = "";

  const crore = Math.floor(n / 10000000);
  let rem = n % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;

  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  const hundred = rem;

  if (crore > 0) {
    words += `${twoDigits(crore)} ${crore === 1 ? "Crore" : "Crores"} `;
  }

  if (lakh > 0) {
    words += `${twoDigits(lakh)} ${lakh === 1 ? "Lakh" : "Lakhs"} `;
  }

  if (thousand > 0) {
    words += `${twoDigits(thousand)} Thousand `;
  }

  if (hundred > 0) {
    words += `${threeDigits(hundred)} `;
  }

  return `${words.trim()} Only`;
}
