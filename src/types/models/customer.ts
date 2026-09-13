export enum CustomerTier {
  STANDARD = "STANDARD",
  PREMIUM = "PREMIUM",
  VIP = "VIP",
}

export interface Customer {
  readonly customerId: string;
  readonly name: string;
  readonly email: string;
  readonly tier: CustomerTier;
  readonly accountCreatedAt: Date;
  readonly totalOrders: number;
  readonly totalRefunds: number;
  readonly flagged: boolean;
  readonly flagReasons: readonly string[];
}
