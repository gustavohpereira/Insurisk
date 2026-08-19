export interface RiskCalculationPayload {
  customerDocument: string;
  age?: number;
  claimsHistory?: number;
  riskFactors?: string[];
}

export interface RiskCalculationResult {
  customerDocument: string;
  score: number;
}
