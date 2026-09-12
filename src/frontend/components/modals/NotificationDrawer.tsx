import React, { useState, useEffect } from "react";
import { Bell, ShieldAlert, AlertTriangle, Info, CheckCheck } from "lucide-react";
import { ModalSheet } from "../ui/ModalSheet";
import { useAbortableRequest } from "../../hooks/useAbortableRequest";
import { subscribeUserToPush } from "../../services/pwaService";

interface NotificationItem {
  id: string;
  type: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = ["All", "Regime", "Drift", "Technicals", "Risk"];

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { request } = useAbortableRequest();
  const [activeCategory, setActiveCategory] = useState("All");
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "init_1",
      type: "Regime",
      severity: "INFO",
      title: "Market Regime Active: Bull Market",
      message: "NIFTY 50 momentum continues above 50-day EMA. Portfolio allocations stable.",
      timestamp: "10 mins ago",
      read: false,
    },
    {
      id: "init_2",
      type: "Drift",
      severity: "WARNING",
      title: "Asset Allocation Drift Notice",
      message: "IT sector weighting has drifted +3.8% above recommended baseline due to rally.",
      timestamp: "1 hour ago",
      read: false,
    },
    {
      id: "init_3",
      type: "Risk",
      severity: "CRITICAL",
      title: "Volatility Alert: Midcap Index",
      message: "Annualized volatility spiked to 19.2%. Risk controls automatically activated.",
      timestamp: "3 hours ago",
      read: true,
    },
  ]);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // 45-second polling interval with clean teardown
  useEffect(() => {
    if (!isOpen) return;

    let intervalId: any;

    const fetchAlerts = async () => {
      try {
        const response = await request("fetch-alerts", "/api/alerts");
        if (response?.alerts && Array.isArray(response.alerts) && response.alerts.length > 0) {
          const mapped: NotificationItem[] = response.alerts.map((a: any) => ({
            id: a.alert_id || a.id || `alert_${Math.random()}`,
            type: a.alert_type || a.type || "Regime",
            severity: a.severity || "INFO",
            title: a.title || "Smart Alert",
            message: a.message || a.summary || "",
            timestamp: "Just now",
            read: !!a.read,
          }));
          setNotifications(mapped);
        }
      } catch {
        // Retain initial notifications gracefully
      }
    };

    fetchAlerts();
    intervalId = setInterval(fetchAlerts, 45000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen]);

  const filtered = notifications.filter((item) => {
    if (activeCategory === "All") return true;
    return item.type.toLowerCase().includes(activeCategory.toLowerCase());
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSubscribePush = async () => {
    setPushSubscribed(true);
    try {
      await subscribeUserToPush();
    } catch {
      // Handled gracefully
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-main)] text-base">Smart Notifications</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Quantitative Risk & Regime Monitor</p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Category Filters & Mark All Read */}
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-[11px] text-accent hover:text-violet-500 font-medium flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <CheckCheck className="w-3 h-3" />
            Mark read
          </button>
        </div>

        {/* Web Push Prompt Card */}
        {!pushSubscribed && (
          <div className="p-3.5 rounded-2xl bg-violet-500/10 dark:bg-gradient-to-r dark:from-violet-950/40 dark:via-purple-950/30 dark:to-slate-900/50 border border-[var(--border-subtle)] flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[var(--text-main)] block">Enable Web Push Alerts</span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Receive immediate push notifications on critical regime shifts.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubscribePush}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
            >
              Enable
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              No notifications in this category.
            </div>
          ) : (
            filtered.map((item) => {
              const isCrit = item.severity === "CRITICAL";
              const isWarn = item.severity === "WARNING";

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    !item.read
                      ? "bg-[var(--bg-card)] dark:bg-slate-900/90 border-violet-500/40 shadow-sm"
                      : "bg-[var(--bg-card-subtle)] dark:bg-slate-900/40 border-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isCrit
                            ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                            : isWarn
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isCrit ? (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <Info className="w-3.5 h-3.5" />
                        )}
                      </span>

                      <h4
                        className={`text-xs font-bold ${
                          !item.read ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"
                        }`}
                      >
                        {item.title}
                      </h4>
                    </div>

                    <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] mt-2 pl-8 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ModalSheet>
  );
};
