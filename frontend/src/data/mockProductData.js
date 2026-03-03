// Mock data cho trang Hàng hóa

export const categories = [
  { id: 1, name: "Thép" },
  { id: 2, name: "Kim loại màu" },
  { id: 3, name: "Vật liệu xây dựng" },
  { id: 4, name: "Điện - Nước" },
];

export const warehouses = [
  { id: 1, name: "Kho VL - A1", area: "Kho VL" },
  { id: 2, name: "Kho VL - A2", area: "Kho VL" },
  { id: 3, name: "Kho SX - B1", area: "Kho SX" },
  { id: 4, name: "Kho SX - B2", area: "Kho SX" },
  { id: 5, name: "Kho TP - C1", area: "Kho TP" },
  { id: 6, name: "Kho TP - C2", area: "Kho TP" },
];

export const productInventory = [
  { id: 1, name: "Thép cuộn HRC", categoryId: 1, unit: "tấn", warehouseId: 1, quantity: 150 },
  { id: 2, name: "Thép cuộn HRC", categoryId: 1, unit: "tấn", warehouseId: 3, quantity: 80 },
  { id: 3, name: "Thép tấm", categoryId: 1, unit: "tấn", warehouseId: 1, quantity: 200 },
  { id: 4, name: "Thép tấm", categoryId: 1, unit: "tấn", warehouseId: 2, quantity: 120 },
  { id: 5, name: "Nhôm thanh", categoryId: 2, unit: "kg", warehouseId: 3, quantity: 5000 },
  { id: 6, name: "Nhôm thanh", categoryId: 2, unit: "kg", warehouseId: 4, quantity: 3200 },
  { id: 7, name: "Đồng thỏi", categoryId: 2, unit: "kg", warehouseId: 3, quantity: 800 },
  { id: 8, name: "Xi măng PCB40", categoryId: 3, unit: "bao", warehouseId: 1, quantity: 2500 },
  { id: 9, name: "Xi măng PCB40", categoryId: 3, unit: "bao", warehouseId: 5, quantity: 1800 },
  { id: 10, name: "Cát xây dựng", categoryId: 3, unit: "m³", warehouseId: 2, quantity: 450 },
  { id: 11, name: "Gạch ống", categoryId: 3, unit: "viên", warehouseId: 1, quantity: 15000 },
  { id: 12, name: "Gạch ống", categoryId: 3, unit: "viên", warehouseId: 6, quantity: 8000 },
  { id: 13, name: "Sắt phi 10", categoryId: 1, unit: "cây", warehouseId: 2, quantity: 3500 },
  { id: 14, name: "Sắt phi 10", categoryId: 1, unit: "cây", warehouseId: 4, quantity: 2200 },
  { id: 15, name: "Ống nhựa PVC", categoryId: 4, unit: "ống", warehouseId: 5, quantity: 1200 },
  { id: 16, name: "Ống nhựa PVC", categoryId: 4, unit: "ống", warehouseId: 6, quantity: 900 },
  { id: 17, name: "Dây điện 2.5mm", categoryId: 4, unit: "cuộn", warehouseId: 5, quantity: 650 },
  { id: 18, name: "Dây điện 2.5mm", categoryId: 4, unit: "cuộn", warehouseId: 3, quantity: 400 },
];
