export interface OrderSchedule {
  id: number;
  inventoryResultId: number;
  parameterId: number;
  productId: string;
  productName: string;
  orderSequence: number;
  orderDate: string;
  expectedDeliveryDate: string;
  orderQuantity: number;
  estimatedCost: number;
  isReorderWarning: boolean;
  actualOrderDate: string;
  actualDeliveryDate: string;
  actualQuantity: number;
  createdAt: string;
}

export interface OrderScheduleChain {
  id: number;
  inventoryResultId: number;
  parameterId: number;
  productId: string;
  orderSequence: number;
  orderDate: string;
  expectedDeliveryDate: string;
  orderQuantity: number;
  estimatedCost: number;
}
