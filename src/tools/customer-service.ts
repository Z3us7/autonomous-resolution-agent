import { Customer, CustomerTier } from "../types/models/customer";
import { Result, ToolError, ToolErrorCode } from "../types/errors";
import { ICustomerService } from "../types/interfaces";

export class CustomerService implements ICustomerService {
  private mockCustomers: Customer[] = [
    {
      customerId: "CUST-001",
      name: "Rahul M.",
      email: "rahul@example.com",
      tier: CustomerTier.PREMIUM,
      accountCreatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 365), // 1 year old
      totalOrders: 15,
      totalRefunds: 1,
      flagged: false,
      flagReasons: [],
    },
    {
      customerId: "CUST-007",
      name: "Suspicious Steve",
      email: "steve@example.com",
      tier: CustomerTier.STANDARD,
      accountCreatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 10), // 10 days old
      totalOrders: 8,
      totalRefunds: 5,
      flagged: true,
      flagReasons: ["serial_refunder"],
    },
  ];

  public async getCustomer(customerId: string): Promise<Result<Customer, ToolError>> {
    const customer = this.mockCustomers.find(c => c.customerId === customerId);
    if (!customer) {
      return {
        success: false,
        error: {
          code: ToolErrorCode.CUSTOMER_NOT_FOUND,
          message: `Customer ${customerId} not found`,
          recoverable: false,
          suggestedAlternatives: []
        }
      };
    }
    return { success: true, data: customer };
  }

  public async getCustomerByEmail(email: string): Promise<Result<Customer, ToolError>> {
    const customer = this.mockCustomers.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (!customer) {
      return {
        success: false,
        error: {
          code: ToolErrorCode.CUSTOMER_NOT_FOUND,
          message: `Customer with email ${email} not found`,
          recoverable: false,
          suggestedAlternatives: []
        }
      };
    }
    return { success: true, data: customer };
  }
}
