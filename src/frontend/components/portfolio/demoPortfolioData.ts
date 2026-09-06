export interface PortfolioHoldingItem {
  symbol: string;
  name: string;
  sector: string;
  shares: number;
  buy_price: number;
  current_price: number;
  invested_amount: number;
  current_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  weight: number;
  target_weight?: number;
  prev_close_price?: number;
  pnl_1d: number;
  pnl_1d_pct: number;
}

export interface BenchmarkComparison {
  portfolio_return_pct: number;
  nifty_return_pct: number;
  bank_fd_return_pct: number;
  alpha_vs_nifty: number;
  alpha_vs_fd: number;
}

export interface PortfolioData {
  portfolio_id: string;
  name: string;
  initial_capital: number;
  cash: number;
  invested_capital: number;
  current_value: number;
  total_pnl: number;
  total_pnl_pct: number;
  pnl_1d: number;
  pnl_1d_pct: number;
  max_drawdown_pct: number;
  holdings: PortfolioHoldingItem[];
  benchmark_comparison: BenchmarkComparison;
  initial_regime: string;
  current_regime: string;
  risk_persona: string;
  horizon: string;
  created_at: string;
  as_of_date: string;
  is_demo?: boolean;
}

export interface CompoundingYearlyPoint {
  year: number;
  invested_lump_sum: number;
  value_lump_sum: number;
  invested_sip: number;
  value_sip: number;
  invested_step_up: number;
  value_step_up: number;
  bank_fd_value: number;
  gbm_pessimistic_10th: number;
  gbm_base_50th: number;
  gbm_optimistic_90th: number;
}

export interface CompoundingTrajectoryData {
  initial_lump_sum: number;
  monthly_sip: number;
  tenure_years: number;
  expected_return_pct: number;
  step_up_pct: number;
  annual_volatility_pct: number;
  yearly_trajectories: CompoundingYearlyPoint[];
  bank_fd_hurdle_value: number;
  alpha_vs_bank_fd: number;
}

export const DEMO_HOLDINGS: PortfolioHoldingItem[] = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    sector: "Energy / Conglomerate",
    shares: 10,
    buy_price: 2850.0,
    current_price: 2980.5,
    invested_amount: 28500.0,
    current_value: 29805.0,
    unrealized_pnl: 1305.0,
    unrealized_pnl_pct: 4.58,
    weight: 0.28,
    pnl_1d: 320.0,
    pnl_1d_pct: 1.09,
    prev_close_price: 2948.5,
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services Ltd",
    sector: "Information Technology",
    shares: 6,
    buy_price: 3950.0,
    current_price: 4120.0,
    invested_amount: 23700.0,
    current_value: 24720.0,
    unrealized_pnl: 1020.0,
    unrealized_pnl_pct: 4.30,
    weight: 0.23,
    pnl_1d: 145.0,
    pnl_1d_pct: 0.59,
    prev_close_price: 4095.8,
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd",
    sector: "Banking & Financials",
    shares: 14,
    buy_price: 1580.0,
    current_price: 1665.0,
    invested_amount: 22120.0,
    current_value: 23310.0,
    unrealized_pnl: 1190.0,
    unrealized_pnl_pct: 5.38,
    weight: 0.22,
    pnl_1d: 210.0,
    pnl_1d_pct: 0.91,
    prev_close_price: 1650.0,
  },
  {
    symbol: "INFY",
    name: "Infosys Ltd",
    sector: "Information Technology",
    shares: 8,
    buy_price: 1540.0,
    current_price: 1610.0,
    invested_amount: 12320.0,
    current_value: 12880.0,
    unrealized_pnl: 560.0,
    unrealized_pnl_pct: 4.55,
    weight: 0.12,
    pnl_1d: -65.0,
    pnl_1d_pct: -0.50,
    prev_close_price: 1618.1,
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank Ltd",
    sector: "Banking & Financials",
    shares: 7,
    buy_price: 1120.0,
    current_price: 1195.0,
    invested_amount: 7840.0,
    current_value: 8365.0,
    unrealized_pnl: 525.0,
    unrealized_pnl_pct: 6.70,
    weight: 0.08,
    pnl_1d: 85.0,
    pnl_1d_pct: 1.03,
    prev_close_price: 1182.9,
  },
  {
    symbol: "LT",
    name: "Larsen & Toubro Ltd",
    sector: "Capital Goods & Infra",
    shares: 2,
    buy_price: 3450.0,
    current_price: 3620.0,
    invested_amount: 6900.0,
    current_value: 7240.0,
    unrealized_pnl: 340.0,
    unrealized_pnl_pct: 4.93,
    weight: 0.07,
    pnl_1d: 40.0,
    pnl_1d_pct: 0.56,
    prev_close_price: 3600.0,
  },
];

export function getDemoPortfolio(): PortfolioData {
  const invested_capital = DEMO_HOLDINGS.reduce(
    (acc, h) => acc + h.invested_amount,
    0
  );
  const holdings_current_value = DEMO_HOLDINGS.reduce(
    (acc, h) => acc + h.current_value,
    0
  );
  const cash = 3680.0;
  const current_value = holdings_current_value + cash;
  const initial_capital = invested_capital + cash;
  const total_pnl = current_value - initial_capital;
  const total_pnl_pct = (total_pnl / initial_capital) * 100;

  const pnl_1d = DEMO_HOLDINGS.reduce((acc, h) => acc + h.pnl_1d, 0);
  const prev_total_value = current_value - pnl_1d;
  const pnl_1d_pct = prev_total_value > 0 ? (pnl_1d / prev_total_value) * 100 : 0;

  return {
    portfolio_id: "demo-portfolio-nifty50",
    name: "Demo NIFTY 50 Balanced Basket",
    initial_capital,
    cash,
    invested_capital,
    current_value,
    total_pnl,
    total_pnl_pct,
    pnl_1d,
    pnl_1d_pct,
    max_drawdown_pct: 3.2,
    holdings: DEMO_HOLDINGS,
    benchmark_comparison: {
      portfolio_return_pct: total_pnl_pct,
      nifty_return_pct: 3.42,
      bank_fd_return_pct: 1.15,
      alpha_vs_nifty: total_pnl_pct - 3.42,
      alpha_vs_fd: total_pnl_pct - 1.15,
    },
    initial_regime: "BULL_TRENDING",
    current_regime: "BULL_TRENDING",
    risk_persona: "Balanced",
    horizon: "6M",
    created_at: new Date().toISOString(),
    as_of_date: new Date().toISOString().split("T")[0],
    is_demo: true,
  };
}

export function getDemoCompoundingTrajectory(
  initialLumpSum = 100000
): CompoundingTrajectoryData {
  const yearly_trajectories: CompoundingYearlyPoint[] = [];
  const expectedReturn = 0.13;
  const fdRate = 0.07;
  const vol = 0.15;

  for (let year = 1; year <= 10; year++) {
    const fdVal = initialLumpSum * Math.pow(1 + fdRate, year);
    const medianVal = initialLumpSum * Math.pow(1 + expectedReturn, year);
    // Quantile cones using standard lognormal approximation
    const sigmaSqrtT = vol * Math.sqrt(year);
    const q10Val = medianVal * Math.exp(-1.28155 * sigmaSqrtT);
    const q90Val = medianVal * Math.exp(1.28155 * sigmaSqrtT);

    yearly_trajectories.push({
      year,
      invested_lump_sum: initialLumpSum,
      value_lump_sum: Math.round(medianVal),
      invested_sip: 0,
      value_sip: 0,
      invested_step_up: 0,
      value_step_up: 0,
      bank_fd_value: Math.round(fdVal),
      gbm_pessimistic_10th: Math.round(q10Val),
      gbm_base_50th: Math.round(medianVal),
      gbm_optimistic_90th: Math.round(q90Val),
    });
  }

  const finalYear = yearly_trajectories[yearly_trajectories.length - 1];
  const finalMedian = finalYear.gbm_base_50th;
  const finalFd = finalYear.bank_fd_value;

  return {
    initial_lump_sum: initialLumpSum,
    monthly_sip: 0,
    tenure_years: 10,
    expected_return_pct: 13.0,
    step_up_pct: 0,
    annual_volatility_pct: 15.0,
    yearly_trajectories,
    bank_fd_hurdle_value: finalFd,
    alpha_vs_bank_fd: Math.round(finalMedian - finalFd),
  };
}
