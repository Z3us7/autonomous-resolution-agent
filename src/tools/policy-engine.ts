import { Customer } from "../types/models/customer";
import { Order } from "../types/models/order";
import { InventoryItem } from "../types/models/inventory";
import { ActionType, PolicyResult } from "../types/models/action";
import { Result, ToolError } from "../types/errors";
import { IPolicyEngine } from "../types/interfaces";

export class PolicyEngine implements IPolicyEngine {
  public async checkRefundEligibility(order: Order, customer: Customer): Promise<Result<PolicyResult, ToolError>> {
    if (!order.deliveredAt) {
      return {
        success: true,
        data: {
          allowed: false,
          reason: "Order has not been delivered yet.",
          policyCode: "NOT_DELIVERED",
          alternativeActions: []
        }
      };
    }

    const daysSinceDelivery = (new Date().getTime() - order.deliveredAt.getTime()) / (1000 * 3600 * 24);
    if (daysSinceDelivery > 30) {
      return {
        success: true,
        data: {
          allowed: false,
          reason: "Return window of 30 days exceeded.",
          policyCode: "REFUND_WINDOW_EXCEEDED",
          alternativeActions: [ActionType.STORE_CREDIT]
        }
      };
    }

    return {
      success: true,
      data: {
        allowed: true,
        reason: "Within refund window.",
        policyCode: "OK",
        alternativeActions: []
      }
    };
  }

  public async checkReplacementEligibility(order: Order, inventoryItem: InventoryItem): Promise<Result<PolicyResult, ToolError>> {
    if (inventoryItem.availableQuantity <= 0) {
      return {
        success: true,
        data: {
          allowed: false,
          reason: "Item out of stock for replacement.",
          policyCode: "ITEM_OUT_OF_STOCK",
          alternativeActions: [ActionType.REFUND, ActionType.STORE_CREDIT]
        }
      };
    }

    return {
      success: true,
      data: {
        allowed: true,
        reason: "Item in stock.",
        policyCode: "OK",
        alternativeActions: []
      }
    };
  }

  public async checkStoreCreditEligibility(order: Order, customer: Customer): Promise<Result<PolicyResult, ToolError>> {
    return {
      success: true,
      data: {
        allowed: true,
        reason: "Store credit is always allowed as a fallback.",
        policyCode: "OK",
        alternativeActions: []
      }
    };
  }
}
