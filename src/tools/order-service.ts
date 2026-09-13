import { Order, OrderStatus, PaymentMethod } from "../types/models/order";
import { InventoryItem } from "../types/models/inventory";
import { Result, ToolError, ToolErrorCode } from "../types/errors";
import { IOrderService } from "../types/interfaces";

export class OrderService implements IOrderService {
  private mockOrders: Order[] = [
    {
      orderId: "ORD-1234",
      customerId: "CUST-001",
      items: [
        { productId: "PROD-1", productName: "Premium Headphones", quantity: 1, price: 4500 }
      ],
      totalAmount: 4500,
      currency: "INR",
      status: OrderStatus.DELIVERED,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      orderedAt: new Date(Date.now() - 1000 * 3600 * 24 * 10),
      deliveredAt: new Date(Date.now() - 1000 * 3600 * 24 * 8), // 8 days ago
      shippingAddress: "Mumbai, India",
    },
    {
      orderId: "ORD-9999",
      customerId: "CUST-007",
      items: [
        { productId: "PROD-2", productName: "Gaming Monitor", quantity: 1, price: 12000 }
      ],
      totalAmount: 12000,
      currency: "INR",
      status: OrderStatus.DELIVERED,
      paymentMethod: PaymentMethod.UPI,
      orderedAt: new Date(Date.now() - 1000 * 3600 * 24 * 4),
      deliveredAt: new Date(Date.now() - 1000 * 3600 * 24 * 2), // 2 days ago
      shippingAddress: "Delhi, India",
    },
  ];

  private mockInventory: InventoryItem[] = [
    { productId: "PROD-1", productName: "Premium Headphones", availableQuantity: 0, warehouseLocation: "WH-A" }, // OUT OF STOCK for demo
    { productId: "PROD-2", productName: "Gaming Monitor", availableQuantity: 5, warehouseLocation: "WH-B" },
  ];

  public async getOrder(orderId: string): Promise<Result<Order, ToolError>> {
    const order = this.mockOrders.find(o => o.orderId === orderId);
    if (!order) {
      return {
        success: false,
        error: {
          code: ToolErrorCode.ORDER_NOT_FOUND,
          message: `Order ${orderId} not found`,
          recoverable: true,
          suggestedAlternatives: []
        }
      };
    }
    return { success: true, data: order };
  }

  public async getOrdersByCustomer(customerId: string): Promise<Result<readonly Order[], ToolError>> {
    const orders = this.mockOrders.filter(o => o.customerId === customerId);
    return { success: true, data: orders };
  }

  public async checkInventory(productId: string): Promise<Result<InventoryItem, ToolError>> {
    const item = this.mockInventory.find(i => i.productId === productId);
    if (!item) {
      return {
        success: false,
        error: {
          code: ToolErrorCode.INVENTORY_UNAVAILABLE,
          message: `Product ${productId} not found in inventory system`,
          recoverable: false,
          suggestedAlternatives: []
        }
      };
    }
    return { success: true, data: item };
  }
}
