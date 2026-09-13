export interface InventoryItem {
  readonly productId: string;
  readonly productName: string;
  readonly availableQuantity: number;
  readonly warehouseLocation: string;
}
