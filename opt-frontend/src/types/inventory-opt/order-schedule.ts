export interface OrderSchedule {
    id: number;
    inventoryResultId: number;
    productId: number;
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