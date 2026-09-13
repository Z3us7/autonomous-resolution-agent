import { Customer } from "../types/models/customer";
import { Order } from "../types/models/order";
import { ActionType } from "../types/models/action";
import { FraudRecommendation } from "../types/models/fraud";
import { CustomerService } from "../tools/customer-service";
import { OrderService } from "../tools/order-service";
import { PolicyEngine } from "../tools/policy-engine";
import { FraudDetector } from "../tools/fraud-detector";
import { ActionExecutor } from "../tools/action-executor";
import { VerificationService } from "../tools/verification-service";
import { OpenRouterClient, OpenRouterMessage, OpenRouterTool } from "./openrouter-client";

export type AgentState = "IDLE" | "GATHERING" | "CHECKING_FRAUD" | "CHECKING_POLICY" | "EXECUTING" | "VERIFYING" | "ADAPTING" | "ESCALATED" | "RESOLVED";

export interface AgentLog {
  timestamp: Date;
  state: AgentState;
  message: string;
}

export class AgentController {
  private customerService = new CustomerService();
  private orderService = new OrderService();
  private policyEngine = new PolicyEngine();
  private fraudDetector = new FraudDetector();
  private actionExecutor = new ActionExecutor();
  private verificationService = new VerificationService();
  private openRouter = new OpenRouterClient();

  public logs: AgentLog[] = [];
  public onLog?: (log: AgentLog) => void;

  private log(state: AgentState, message: string) {
    const logEntry = { timestamp: new Date(), state, message };
    this.logs.push(logEntry);
    console.log(`[${state}] ${message}`);
    if (this.onLog) {
      this.onLog(logEntry);
    }
  }

  // Define tools for OpenAI JSON Schema
  private tools: OpenRouterTool[] = [
    {
      type: "function",
      function: {
        name: "getCustomerAndOrder",
        description: "Retrieve customer and order records by IDs.",
        parameters: {
          type: "object",
          properties: {
            customerId: { type: "string" },
            orderId: { type: "string" }
          },
          required: ["customerId", "orderId"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "assessFraudRisk",
        description: "Assess fraud risk for a customer and order.",
        parameters: {
          type: "object",
          properties: {
            customerId: { type: "string" },
            orderId: { type: "string" },
            requestedAction: { type: "string" }
          },
          required: ["customerId", "orderId", "requestedAction"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "checkPolicy",
        description: "Check if an action is permitted by policy.",
        parameters: {
          type: "object",
          properties: {
            customerId: { type: "string" },
            orderId: { type: "string" },
            requestedAction: { type: "string" }
          },
          required: ["customerId", "orderId", "requestedAction"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "executeAction",
        description: "Execute a resolution action.",
        parameters: {
          type: "object",
          properties: {
            action: { type: "string" },
            customerId: { type: "string" },
            orderId: { type: "string" }
          },
          required: ["action", "customerId", "orderId"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "verifyAction",
        description: "Verify that an executed action was committed successfully.",
        parameters: {
          type: "object",
          properties: {
            actionId: { type: "string" }
          },
          required: ["actionId"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "escalate",
        description: "Escalate the case to a human.",
        parameters: {
          type: "object",
          properties: {
            reason: { type: "string" }
          },
          required: ["reason"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "resolve",
        description: "Mark the case as successfully resolved after verification.",
        parameters: {
          type: "object",
          properties: {
            message: { type: "string" }
          },
          required: ["message"]
        }
      }
    }
  ];

  public async resolveIssue(userInput: string): Promise<void> {
    this.log("IDLE", `Received user input: "${userInput}"`);
    
    let messages: OpenRouterMessage[] = [
      {
        role: "system",
        content: `You are an Autonomous Customer Resolution Agent. 
Your goal is to resolve customer requests safely.
Follow this strict workflow:
1. GATHER: Use getCustomerAndOrder to retrieve data. (Assume standard action is REFUND if not specified).
2. FRAUD: Use assessFraudRisk. If CRITICAL, you must call escalate immediately.
3. POLICY: Use checkPolicy. If the policy blocks the action, look at alternativeActions.
4. EXECUTE: Use executeAction to perform the action or alternative.
5. VERIFY: Use verifyAction using the actionId returned from executeAction.
6. COMPLETE: call resolve() or escalate().

Never hallucinate data. Only use tools.`
      },
      {
        role: "user",
        content: userInput
      }
    ];

    let loopCount = 0;
    while (loopCount < 10) {
      loopCount++;
      try {
        const responseMessage = await this.openRouter.generateContent(messages, this.tools);
        messages.push(responseMessage); // Add assistant's response to history

        // If no tool call, it means the assistant is just replying with text
        if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
          this.log("IDLE", `Agent thought: ${responseMessage.content}`);
          break; 
        }

        const toolCall = responseMessage.tool_calls[0];
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || "{}");
        let result: any;
        let terminal = false;

        switch (name) {
          case "getCustomerAndOrder":
            this.log("GATHERING", `Fetching details for Customer: ${args.customerId}, Order: ${args.orderId}`);
            const cRes = await this.customerService.getCustomer(args.customerId);
            const oRes = await this.orderService.getOrder(args.orderId);
            result = { customer: cRes, order: oRes };
            break;

          case "assessFraudRisk":
            this.log("CHECKING_FRAUD", "Assessing fraud risk...");
            const fC = await this.customerService.getCustomer(args.customerId);
            const fO = await this.orderService.getOrder(args.orderId);
            if (fC.success && fO.success) {
              const fRes = await this.fraudDetector.assessFraudRisk(fC.data, fO.data, args.requestedAction);
              if (fRes.success) {
                this.log("CHECKING_FRAUD", `Fraud Score: ${fRes.data.score}, Risk: ${fRes.data.riskLevel}`);
              }
              result = fRes;
            } else {
              result = { error: "Customer or order not found for fraud check" };
            }
            break;

          case "checkPolicy":
            this.log("CHECKING_POLICY", `Checking policy for ${args.requestedAction}...`);
            const pC = await this.customerService.getCustomer(args.customerId);
            const pO = await this.orderService.getOrder(args.orderId);
            if (pC.success && pO.success) {
              if (args.requestedAction === ActionType.REFUND) {
                result = await this.policyEngine.checkRefundEligibility(pO.data, pC.data);
                if (result.success && !result.data.allowed) {
                   this.log("ADAPTING", `Policy denied: ${result.data.reason}. Adapting plan to check alternatives...`);
                }
              } else {
                result = { success: true, data: { allowed: true } }; // mock pass for others
              }
            } else {
              result = { error: "Customer or order not found for policy check" };
            }
            break;

          case "executeAction":
            this.log("EXECUTING", `Executing action: ${args.action}...`);
            const exO = await this.orderService.getOrder(args.orderId);
            if (exO.success) {
              if (args.action === ActionType.REFUND) {
                result = await this.actionExecutor.executeRefund(args.orderId, exO.data.totalAmount);
              } else if (args.action === ActionType.STORE_CREDIT) {
                result = await this.actionExecutor.issueStoreCredit(args.customerId, exO.data.totalAmount);
              }
              if (result.success) {
                this.log("EXECUTING", `Action processed. ID: ${result.data.actionId}`);
              }
            } else {
              result = { error: "Order not found" };
            }
            break;

          case "verifyAction":
            this.log("VERIFYING", `Verifying state change for action ${args.actionId}...`);
            result = await this.verificationService.verifyAction(args.actionId);
            break;

          case "escalate":
            this.log("ESCALATED", `Escalated: ${args.reason}`);
            result = { success: true };
            terminal = true;
            break;

          case "resolve":
            this.log("RESOLVED", `Resolved: ${args.message}`);
            result = { success: true };
            terminal = true;
            break;

          default:
            result = { error: `Unknown tool: ${name}` };
        }

        if (terminal) break;

        // Provide the tool result back to the model
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: name,
          content: JSON.stringify(result)
        });

      } catch (err: any) {
        this.log("ESCALATED", `LLM Error: ${err.message}`);
        break;
      }
    }
  }
}
