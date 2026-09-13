export enum ActionType {
  REFUND = "REFUND",
  REPLACEMENT = "REPLACEMENT",
  STORE_CREDIT = "STORE_CREDIT",
  ESCALATE_TO_HUMAN = "ESCALATE_TO_HUMAN",
}

export interface PolicyResult {
  readonly allowed: boolean;
  readonly reason: string;
  readonly policyCode: string;
  readonly alternativeActions: readonly ActionType[];
}

export interface ActionResult {
  readonly actionId: string;
  readonly actionType: ActionType;
  readonly success: boolean;
  readonly failureReason: string | null;
  readonly timestamp: Date;
}
