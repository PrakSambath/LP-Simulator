export interface Simulation {
  id: string;
  protocol: string;
  tokenA: string;
  tokenB: string;
  initialInvestment?: number; // Make optional for backwards compatibility
  amountA?: number;
  amountB?: number;
  apr: number;
  duration: number; // in days
  lowerPriceBound: number;
  upperPriceBound: number;
  startDate: string;
  initialPriceA: number;
  initialPriceB: number;
  latestPriceA: number;
  latestPriceB: number;
  tradeVolume?: number;
  volumeFee?: number;
  isHedgeEnabled?: boolean;
  shortAmount: number;
  fundingRate: number;
  shortToken: 'A' | 'B';
}