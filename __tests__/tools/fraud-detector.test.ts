import { describe, it, expect } from 'vitest';
import { FraudRiskLevel, FraudRecommendation, FraudAssessment } from '../../src/types/models/fraud';
import { Customer, CustomerTier } from '../../src/types/models/customer';
import { Order, OrderStatus, PaymentMethod } from '../../src/types/models/order';
import { ActionType } from '../../src/types/models/action';
import { FraudDetector } from '../../src/tools/fraud-detector';

describe('FraudDetector', () => {
  const detector = new FraudDetector();

  const createCustomer = (overrides: Partial<Customer>): Customer => ({
    customerId: 'CUST-001',
    name: 'John Doe',
    email: 'john@example.com',
    tier: CustomerTier.STANDARD,
    accountCreatedAt: new Date(),
    totalOrders: 10,
    totalRefunds: 1,
    flagged: false,
    flagReasons: [],
    ...overrides
  });

  const createOrder = (overrides: Partial<Order>): Order => ({
    orderId: 'ORD-001',
    customerId: 'CUST-001',
    items: [],
    totalAmount: 1000,
    currency: 'INR',
    status: OrderStatus.DELIVERED,
    paymentMethod: PaymentMethod.CREDIT_CARD,
    orderedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    shippingAddress: '123 Main St',
    ...overrides
  });

  it('should return LOW risk for standard customer', async () => {
    const customer = createCustomer({});
    const order = createOrder({});
    
    const result = await detector.assessFraudRisk(customer, order, ActionType.REFUND);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.riskLevel).toBe(FraudRiskLevel.LOW);
      expect(result.data.recommendation).toBe(FraudRecommendation.PROCEED);
    }
  });

  it('should return CRITICAL risk if customer is already flagged', async () => {
    const customer = createCustomer({ flagged: true, flagReasons: ['abuse'] });
    const order = createOrder({});
    
    const result = await detector.assessFraudRisk(customer, order, ActionType.REFUND);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.riskLevel).toBe(FraudRiskLevel.CRITICAL);
      expect(result.data.recommendation).toBe(FraudRecommendation.BLOCK_AND_ESCALATE);
      expect(result.data.signals).toContain('already_flagged');
    }
  });

  it('should add points for high refund ratio', async () => {
    const customer = createCustomer({ totalOrders: 10, totalRefunds: 6 }); // >40%
    const order = createOrder({});
    
    const result = await detector.assessFraudRisk(customer, order, ActionType.REFUND);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.score).toBeGreaterThanOrEqual(30);
      expect(result.data.signals).toContain('high_refund_ratio');
    }
  });

  it('should add points for new account high value', async () => {
    const customer = createCustomer({ accountCreatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) }); // 10 days old
    const order = createOrder({ totalAmount: 6000 }); // > 5000
    
    const result = await detector.assessFraudRisk(customer, order, ActionType.REFUND);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.score).toBeGreaterThanOrEqual(25);
      expect(result.data.signals).toContain('new_account_high_value');
    }
  });

  it('should escalate to HIGH if risk score between 51-75', async () => {
    const customer = createCustomer({
      accountCreatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // new
      totalOrders: 10,
      totalRefunds: 6 // high ratio
    });
    const order = createOrder({ totalAmount: 6000 }); // high value
    
    const result = await detector.assessFraudRisk(customer, order, ActionType.REFUND);
    expect(result.success).toBe(true);
    if (result.success) {
      // ratio (+30), new_high_value (+25) -> 55 (HIGH)
      expect(result.data.riskLevel).toBe(FraudRiskLevel.HIGH);
      expect(result.data.recommendation).toBe(FraudRecommendation.REQUIRE_VERIFICATION);
    }
  });
});
