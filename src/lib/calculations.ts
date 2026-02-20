/**
 * Universal Financial Calculations for Digitalsight Financials
 */

export interface FinancialStats {
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  totalWithdrawn: number;
  pendingAmount: number;
  balance: number;
  sharePercent: number;
}

/**
 * Calculates the net revenue based on gross and share percentage
 */
export const calculateNet = (gross: number, sharePercent: number): number => {
  return gross * (sharePercent / 100);
};

/**
 * Calculates the deduction amount (label's cut)
 */
export const calculateDeductions = (gross: number, net: number): number => {
  return gross - net;
};

/**
 * Calculates the available balance
 */
export const calculateBalance = (net: number, withdrawn: number, pending: number): number => {
  return net - withdrawn - pending;
};

/**
 * Processes a list of reports to calculate aggregate stats
 */
export const aggregateReportStats = (reports: any[], sharePercent: number, withdrawn: number = 0, pending: number = 0): FinancialStats => {
  const totalGross = reports.reduce((acc, report) => acc + (Number(report.total_revenue) || 0), 0);
  const totalNet = calculateNet(totalGross, sharePercent);
  const totalDeductions = calculateDeductions(totalGross, totalNet);
  const balance = calculateBalance(totalNet, withdrawn, pending);

  return {
    totalGross,
    totalNet,
    totalDeductions,
    totalWithdrawn: withdrawn,
    pendingAmount: pending,
    balance,
    sharePercent
  };
};

/**
 * Formats a report object with calculated fields for display in tables
 */
export const formatReportRow = (report: any, sharePercent: number) => {
  const gross = Number(report.total_revenue) || 0;
  const net = calculateNet(gross, sharePercent);
  const deductions = calculateDeductions(gross, net);

  return {
    ...report,
    gross,
    net,
    deductions,
    sharePercent
  };
};
