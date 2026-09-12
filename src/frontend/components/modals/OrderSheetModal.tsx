import React, { useState } from "react";
import { FileText, Copy, Check, Download } from "lucide-react";
import { ModalSheet } from "../ui/ModalSheet";
import { PrimaryButton } from "../ui/PrimaryButton";
import { GhostButton } from "../ui/GhostButton";
import { PortfolioData } from "../portfolio/demoPortfolioData";

interface OrderSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: PortfolioData | null;
}

export const OrderSheetModal: React.FC<OrderSheetModalProps> = ({
  isOpen,
  onClose,
  portfolio,
}) => {
  const [activeTab, setActiveTab] = useState<"zerodha" | "groww">("groww");
  const [isCopied, setIsCopied] = useState(false);

  if (!portfolio) return null;

  // Generate copyable text
  const growwText = portfolio.holdings
    .map(
      (h) =>
        `BUY ${h.symbol} | Qty: ${h.shares} | Est Price: ₹${h.current_price} | CNC MARKET`
    )
    .join("\n");

  const zerodhaCsv = [
    "Instrument,Action,Quantity,Price,OrderType,Product",
    ...portfolio.holdings.map(
      (h) => `${h.symbol},BUY,${h.shares},${h.current_price},MARKET,CNC`
    ),
  ].join("\n");

  const handleCopy = () => {
    const textToCopy = activeTab === "groww" ? growwText : zerodhaCsv;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1800);
    }
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([zerodhaCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `quantniti_orders_${portfolio.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-main)] text-base">1-Click Broker Order Sheet</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Execute in your own Zerodha or Groww account</p>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Tab switcher: Groww text vs Zerodha CSV */}
        <div className="flex p-1 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("groww")}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === "groww"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            Groww Clipboard Text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("zerodha")}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === "zerodha"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            Zerodha Basket CSV
          </button>
        </div>

        {/* Order Preview Code Block */}
        <div className="relative rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] p-3 font-mono text-xs text-[var(--text-main)] max-h-48 overflow-y-auto">
          <pre className="whitespace-pre-wrap leading-relaxed text-[11px]">
            {activeTab === "groww" ? growwText : zerodhaCsv}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <PrimaryButton
            onClick={handleCopy}
            icon={isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          >
            {isCopied ? "Copied to Clipboard!" : "Copy Order Instructions"}
          </PrimaryButton>

          {activeTab === "zerodha" && (
            <GhostButton
              onClick={handleDownloadCsv}
              icon={<Download className="w-4 h-4" />}
            >
              Download .CSV File
            </GhostButton>
          )}
        </div>
      </div>
    </ModalSheet>
  );
};
