export enum OrderStatus {
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED",
}

export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  UPI = "UPI",
  WALLET = "WALLET",
}

export interface OrderItem {
  readonly productId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly price: number;
}

export interface Order {
  readonly orderId: string;
  readonly customerId: string;
  readonly items: readonly OrderItem[];
  readonly totalAmount: number;
  readonly currency: "INR";
  readonly status: OrderStatus;
  readonly paymentMethod: PaymentMethod;
  readonly orderedAt: Date;
  readonly deliveredAt: Date | null;
  readonly shippingAddress: string;
}
