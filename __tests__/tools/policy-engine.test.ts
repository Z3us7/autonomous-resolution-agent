import { describe, it, expect } from 'vitest';
import { Customer, CustomerTier } from '../../src/types/models/customer';
import { Order, OrderStatus, PaymentMethod } from '../../src/types/models/order';
import { InventoryItem } from '../../src/types/models/inventory';
import { ActionType } from '../../src/types/models/action';
import { PolicyEngine } from '../../src/tools/policy-engine';

describe('PolicyEngine', () => {
  const engine = new PolicyEngine();

  const createCustomer = (): Customer => ({
    customerId: 'CUST-001',
    name: 'John Doe',
    email: 'john@example.com',
    tier: CustomerTier.STANDARD,
    accountCreatedAt: new Date(),
    totalOrders: 1,
    totalRefunds: 0,
    flagged: false,
    flagReasons: []
  });

  const createOrder = (overrides: Partial<Order>): Order => ({
    orderId: 'ORD-001',
    customerId: 'CUST-001',
    items: [],
    totalAmount: 1000,
    currency: 'INR',
    status: OrderStatus.DELIVERED,
    paymentMethod: PaymentMethod.CREDIT_CARD,
    orderedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    shippingAddress: '123 Main St',
    ...overrides
  });

  it('should allow refund if within 30 days', async () => {
    const order = createOrder({ deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15) }); // 15 days ago
    const customer = createCustomer();

    const result = await engine.checkRefundEligibility(order, customer);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.allowed).toBe(true);
    }
  });

  it('should deny refund and offer store credit if > 30 days', async () => {
    const order = createOrder({ deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35) }); // 35 days ago
    const customer = createCustomer();

    const result = await engine.checkRefundEligibility(order, customer);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.allowed).toBe(false);
      expect(result.data.policyCode).toBe('REFUND_WINDOW_EXCEEDED');
      expect(result.data.alternativeActions).toContain(ActionType.STORE_CREDIT);
    }
  });

  it('should allow replacement if item is in stock', async () => {
    const order = createOrder({});
    const inventory: InventoryItem = {
      productId: 'PROD-1',
      productName: 'Widget',
      availableQuantity: 10,
      warehouseLocation: 'WH-1'
    };

    const result = await engine.checkReplacementEligibility(order, inventory);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.allowed).toBe(true);
    }
  });

  it('should deny replacement and offer refund if item out of stock', async () => {
    const order = createOrder({});
    const inventory: InventoryItem = {
      productId: 'PROD-1',
      productName: 'Widget',
      availableQuantity: 0, // OUT OF STOCK
      warehouseLocation: 'WH-1'
    };

    const result = await engine.checkReplacementEligibility(order, inventory);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.allowed).toBe(false);
      expect(result.data.policyCode).toBe('ITEM_OUT_OF_STOCK');
      expect(result.data.alternativeActions).toContain(ActionType.REFUND);
    }
  });
});
