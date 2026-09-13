import { Customer } from "./models/customer";
import { Order } from "./models/order";
import { InventoryItem } from "./models/inventory";
import { ActionType, ActionResult, PolicyResult } from "./models/action";
import { FraudAssessment } from "./models/fraud";
import { Result, ToolError } from "./errors";

export interface VerificationResult {
  readonly actionId: string;
  readonly verified: boolean;
  readonly message: string;
}

export interface ICustomerService {
  getCustomer(customerId: string): Promise<Result<Customer, ToolError>>;
  getCustomerByEmail(email: string): Promise<Result<Customer, ToolError>>;
}

export interface IOrderService {
  getOrder(orderId: string): Promise<Result<Order, ToolError>>;
  getOrdersByCustomer(customerId: string): Promise<Result<readonly Order[], ToolError>>;
  checkInventory(productId: string): Promise<Result<InventoryItem, ToolError>>;
}

export interface IPolicyEngine {
  checkRefundEligibility(order: Order, customer: Customer): Promise<Result<PolicyResult, ToolError>>;
  checkReplacementEligibility(order: Order, inventoryItem: InventoryItem): Promise<Result<PolicyResult, ToolError>>;
  checkStoreCreditEligibility(order: Order, customer: Customer): Promise<Result<PolicyResult, ToolError>>;
}

export interface IActionExecutor {
  executeRefund(orderId: string, amount: number): Promise<Result<ActionResult, ToolError>>;
  executeReplacement(orderId: string, productId: string): Promise<Result<ActionResult, ToolError>>;
  issueStoreCredit(customerId: string, amount: number): Promise<Result<ActionResult, ToolError>>;
}

export interface IVerificationService {
  verifyAction(actionId: string): Promise<Result<VerificationResult, ToolError>>;
}

export interface IFraudDetector {
  assessFraudRisk(customer: Customer, order: Order, requestedAction: ActionType): Promise<Result<FraudAssessment, ToolError>>;
}
