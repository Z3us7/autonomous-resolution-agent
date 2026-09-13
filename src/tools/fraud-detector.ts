import { Customer } from "../types/models/customer";
import { Order } from "../types/models/order";
import { ActionType } from "../types/models/action";
import { FraudAssessment, FraudRiskLevel, FraudRecommendation } from "../types/models/fraud";
import { Result, ToolError } from "../types/errors";
import { IFraudDetector } from "../types/interfaces";

export class FraudDetector implements IFraudDetector {
  public async assessFraudRisk(customer: Customer, order: Order, requestedAction: ActionType): Promise<Result<FraudAssessment, ToolError>> {
    try {
      let score = 0;
      const signals: string[] = [];

      if (customer.flagged) {
        score += 76;
        signals.push('already_flagged');
      }

      if (customer.totalOrders > 0) {
        const refundRatio = customer.totalRefunds / customer.totalOrders;
        if (refundRatio > 0.4) {
          score += 30;
          signals.push('high_refund_ratio');
        }
      }

      const accountAgeDays = (new Date().getTime() - customer.accountCreatedAt.getTime()) / (1000 * 3600 * 24);
      if (accountAgeDays < 30 && order.totalAmount > 5000) {
        score += 25;
        signals.push('new_account_high_value');
      }

      let riskLevel = FraudRiskLevel.LOW;
      let recommendation = FraudRecommendation.PROCEED;

      if (score >= 76) {
        riskLevel = FraudRiskLevel.CRITICAL;
        recommendation = FraudRecommendation.BLOCK_AND_ESCALATE;
      } else if (score >= 51) {
        riskLevel = FraudRiskLevel.HIGH;
        recommendation = FraudRecommendation.REQUIRE_VERIFICATION;
      } else if (score >= 26) {
        riskLevel = FraudRiskLevel.MEDIUM;
        recommendation = FraudRecommendation.REQUIRE_VERIFICATION;
      }

      const assessment: FraudAssessment = {
        riskLevel,
        score,
        signals,
        recommendation,
      };

      return { success: true, data: assessment };
    } catch (e: unknown) {
      return {
        success: false,
        error: {
          code: "SYSTEM_UNAVAILABLE" as any,
          message: e instanceof Error ? e.message : "Unknown error in fraud detection",
          recoverable: false,
          suggestedAlternatives: []
        }
      };
    }
  }
}
