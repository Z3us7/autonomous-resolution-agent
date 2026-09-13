export enum FraudRiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum FraudRecommendation {
  PROCEED = "PROCEED",
  REQUIRE_VERIFICATION = "REQUIRE_VERIFICATION",
  BLOCK_AND_ESCALATE = "BLOCK_AND_ESCALATE",
}

export interface FraudAssessment {
  readonly riskLevel: FraudRiskLevel;
  readonly score: number;
  readonly signals: readonly string[];
  readonly recommendation: FraudRecommendation;
}
