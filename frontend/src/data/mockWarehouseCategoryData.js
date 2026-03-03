export const mockWarehouses = [
  {
    id: "1",
    name: "Kho A1",
    code: "KHO-A1",
    parentWarehouse: "Kho Tổng Bắc",
    location: "Tầng 1, Khu A",
    status: "active",
    capacity: 1000,
    currentStock: 750
  },
  {
    id: "2",
    name: "Kho A2",
    code: "KHO-A2",
    parentWarehouse: "Kho Tổng Bắc",
    location: "Tầng 2, Khu A",
    status: "active",
    capacity: 800,
    currentStock: 320
  },
  {
    id: "3",
    name: "Kho B1",
    code: "KHO-B1",
    parentWarehouse: "Kho Tổng Nam",
    location: "Tầng 1, Khu B",
    status: "maintenance",
    capacity: 1200,
    currentStock: 0
  },
  {
    id: "4",
    name: "Kho C1",
    code: "KHO-C1",
    parentWarehouse: "Kho Tổng Nam",
    location: "Tầng 1, Khu C",
    status: "active",
    capacity: 500,
    currentStock: 480
  },
  {
    id: "5",
    name: "Kho Lạnh",
    code: "KHO-LANH",
    parentWarehouse: "Kho Tổng Bắc",
    location: "Khu vực đặc biệt",
    status: "inactive",
    capacity: 300,
    currentStock: 0
  }
]
