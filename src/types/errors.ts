import { ActionType } from "./models/action";

export enum ToolErrorCode {
  CUSTOMER_NOT_FOUND = "CUSTOMER_NOT_FOUND",
  ORDER_NOT_FOUND = "ORDER_NOT_FOUND",
  INVENTORY_UNAVAILABLE = "INVENTORY_UNAVAILABLE",
  POLICY_VIOLATION = "POLICY_VIOLATION",
  REFUND_WINDOW_EXCEEDED = "REFUND_WINDOW_EXCEEDED",
  PAYMENT_GATEWAY_ERROR = "PAYMENT_GATEWAY_ERROR",
  ITEM_OUT_OF_STOCK = "ITEM_OUT_OF_STOCK",
  FRAUD_BLOCKED = "FRAUD_BLOCKED",
  VERIFICATION_FAILED = "VERIFICATION_FAILED",
  ACTION_ALREADY_PROCESSED = "ACTION_ALREADY_PROCESSED",
  SYSTEM_UNAVAILABLE = "SYSTEM_UNAVAILABLE",
}

export interface ToolError {
  readonly code: ToolErrorCode;
  readonly message: string;
  readonly recoverable: boolean;
  readonly suggestedAlternatives: readonly ActionType[];
}

export type Result<T, E = ToolError> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };
