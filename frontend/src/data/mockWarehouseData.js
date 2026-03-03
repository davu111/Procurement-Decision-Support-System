// Mock data cho trang Kho hàng

export const warehouses = [
  { id: 1, name: "Kho VL - A1", area: "Kho VL", status: "active" },
  { id: 2, name: "Kho VL - A2", area: "Kho VL", status: "active" },
  { id: 3, name: "Kho SX - B1", area: "Kho SX", status: "active" },
  { id: 4, name: "Kho SX - B2", area: "Kho SX", status: "inactive" },
  { id: 5, name: "Kho TP - C1", area: "Kho TP", status: "active" },
  { id: 6, name: "Kho TP - C2", area: "Kho TP", status: "maintenance" },
];

export const warehouseInventory = [
  { id: 1, warehouseId: 1, productName: "Thép cuộn HRC", quantity: 150, unit: "tấn" },
  { id: 2, warehouseId: 1, productName: "Thép tấm", quantity: 200, unit: "tấn" },
  { id: 3, warehouseId: 1, productName: "Xi măng PCB40", quantity: 2500, unit: "bao" },
  { id: 4, warehouseId: 1, productName: "Gạch ống", quantity: 15000, unit: "viên" },
  { id: 5, warehouseId: 2, productName: "Thép tấm", quantity: 120, unit: "tấn" },
  { id: 6, warehouseId: 2, productName: "Cát xây dựng", quantity: 450, unit: "m³" },
  { id: 7, warehouseId: 2, productName: "Sắt phi 10", quantity: 3500, unit: "cây" },
  { id: 8, warehouseId: 3, productName: "Thép cuộn HRC", quantity: 80, unit: "tấn" },
  { id: 9, warehouseId: 3, productName: "Nhôm thanh", quantity: 5000, unit: "kg" },
  { id: 10, warehouseId: 3, productName: "Đồng thỏi", quantity: 800, unit: "kg" },
  { id: 11, warehouseId: 3, productName: "Dây điện 2.5mm", quantity: 400, unit: "cuộn" },
  { id: 12, warehouseId: 4, productName: "Nhôm thanh", quantity: 3200, unit: "kg" },
  { id: 13, warehouseId: 4, productName: "Sắt phi 10", quantity: 2200, unit: "cây" },
  { id: 14, warehouseId: 5, productName: "Xi măng PCB40", quantity: 1800, unit: "bao" },
  { id: 15, warehouseId: 5, productName: "Ống nhựa PVC", quantity: 1200, unit: "ống" },
  { id: 16, warehouseId: 5, productName: "Dây điện 2.5mm", quantity: 650, unit: "cuộn" },
  { id: 17, warehouseId: 6, productName: "Gạch ống", quantity: 8000, unit: "viên" },
  { id: 18, warehouseId: 6, productName: "Ống nhựa PVC", quantity: 900, unit: "ống" },
];

export const warehouseHistory = [
  { id: 1, warehouseId: 1, date: "2026-01-12 08:30", vehicle: "51C-12345", driver: "Nguyễn Văn An", type: "nhap", productName: "Thép cuộn HRC", quantity: 50, unit: "tấn", planCode: "KH-2026-001" },
  { id: 2, warehouseId: 1, date: "2026-01-11 14:15", vehicle: "51C-67890", driver: "Trần Văn Bình", type: "xuat", productName: "Xi măng PCB40", quantity: 500, unit: "bao", planCode: "KH-2026-002" },
  { id: 3, warehouseId: 1, date: "2026-01-10 09:00", vehicle: "51C-11111", driver: "Lê Văn Cường", type: "nhap", productName: "Gạch ống", quantity: 5000, unit: "viên", planCode: "KH-2026-003" },
  { id: 4, warehouseId: 1, date: "2026-01-09 16:45", vehicle: "51C-22222", driver: "Phạm Văn Dũng", type: "xuat", productName: "Thép tấm", quantity: 30, unit: "tấn", planCode: "KH-2026-004" },
  { id: 5, warehouseId: 2, date: "2026-01-12 10:00", vehicle: "51C-33333", driver: "Hoàng Văn Em", type: "nhap", productName: "Cát xây dựng", quantity: 100, unit: "m³", planCode: "KH-2026-005" },
  { id: 6, warehouseId: 2, date: "2026-01-11 11:30", vehicle: "51C-44444", driver: "Nguyễn Thị Hoa", type: "xuat", productName: "Sắt phi 10", quantity: 500, unit: "cây", planCode: "KH-2026-006" },
  { id: 7, warehouseId: 3, date: "2026-01-12 07:45", vehicle: "51C-55555", driver: "Trần Thị Lan", type: "nhap", productName: "Nhôm thanh", quantity: 1000, unit: "kg", planCode: "KH-2026-007" },
  { id: 8, warehouseId: 3, date: "2026-01-10 15:20", vehicle: "51C-66666", driver: "Lê Thị Mai", type: "xuat", productName: "Đồng thỏi", quantity: 200, unit: "kg", planCode: "KH-2026-008" },
  { id: 9, warehouseId: 4, date: "2026-01-08 09:30", vehicle: "51C-77777", driver: "Nguyễn Văn An", type: "nhap", productName: "Nhôm thanh", quantity: 800, unit: "kg", planCode: "KH-2026-009" },
  { id: 10, warehouseId: 5, date: "2026-01-12 13:00", vehicle: "51C-88888", driver: "Trần Văn Bình", type: "nhap", productName: "Ống nhựa PVC", quantity: 300, unit: "ống", planCode: "KH-2026-010" },
  { id: 11, warehouseId: 5, date: "2026-01-11 08:00", vehicle: "51C-99999", driver: "Lê Văn Cường", type: "xuat", productName: "Xi măng PCB40", quantity: 400, unit: "bao", planCode: "KH-2026-011" },
  { id: 12, warehouseId: 6, date: "2026-01-07 14:30", vehicle: "51C-12345", driver: "Phạm Văn Dũng", type: "nhap", productName: "Gạch ống", quantity: 3000, unit: "viên", planCode: "KH-2026-012" },
];
