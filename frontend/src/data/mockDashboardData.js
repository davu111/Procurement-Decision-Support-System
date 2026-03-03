// Mock data for home dashboard

// KPI data
export const kpiData = {
  totalPeopleInWarehouse: 24,
  totalVehiclesInWarehouse: 8,
  totalPlansToday: 12,
  completedPlans: 7,
};

// Plan statistics data
export const planStatistics = [
  {
    date: "2026-01-12",
    completed: 3,
    inProgress: 4,
    pending: 2,
    total: 9,
  },
  {
    date: "2026-01-11",
    completed: 5,
    inProgress: 3,
    pending: 1,
    total: 9,
  },
  {
    date: "2026-01-10",
    completed: 6,
    inProgress: 2,
    pending: 2,
    total: 10,
  },
  {
    date: "2026-01-09",
    completed: 4,
    inProgress: 5,
    pending: 2,
    total: 11,
  },
  {
    date: "2026-01-08",
    completed: 5,
    inProgress: 4,
    pending: 2,
    total: 11,
  },
  {
    date: "2026-01-07",
    completed: 4,
    inProgress: 3,
    pending: 3,
    total: 10,
  },
];

// Monthly plan statistics
export const monthlyPlanStatistics = [
  { month: "Tháng 1", completed: 42, inProgress: 28, pending: 15 },
  { month: "Tháng 2", completed: 38, inProgress: 32, pending: 18 },
  { month: "Tháng 3", completed: 45, inProgress: 25, pending: 14 },
];

// Warehouse list for filter
export const warehouseList = [
  { id: 1, name: "Kho VL - A1" },
  { id: 2, name: "Kho VL - A2" },
  { id: 3, name: "Kho SX - B1" },
  { id: 4, name: "Kho SX - B2" },
  { id: 5, name: "Kho TP - C1" },
  { id: 6, name: "Kho TP - C2" },
];

// Plan type for filter
export const planTypes = [
  { id: "nhap", label: "Nhập hàng" },
  { id: "xuat", label: "Xuất hàng" },
];

// Detailed plan data by warehouse and type
export const planDataByWarehouse = {
  "1": { completed: 8, inProgress: 5, pending: 2 }, // Kho VL - A1
  "2": { completed: 6, inProgress: 4, pending: 2 }, // Kho VL - A2
  "3": { completed: 7, inProgress: 6, pending: 3 }, // Kho SX - B1
  "4": { completed: 5, inProgress: 5, pending: 2 }, // Kho SX - B2
  "5": { completed: 9, inProgress: 4, pending: 3 }, // Kho TP - C1
  "6": { completed: 7, inProgress: 4, pending: 3 }, // Kho TP - C2
};

// Detailed plan data by type
export const planDataByType = {
  nhap: { completed: 22, inProgress: 16, pending: 9 }, // Nhập hàng
  xuat: { completed: 20, inProgress: 12, pending: 7 }, // Xuất hàng
};

// Recent activities
export const recentActivities = [
  {
    id: 1,
    type: "plan_completed",
    title: "Kế hoạch hoàn thành",
    description: "Kế hoạch KH-2026-001 đã được hoàn thành",
    timestamp: "2026-01-12 14:30",
    icon: "CheckCircle",
  },
  {
    id: 2,
    type: "plan_created",
    title: "Kế hoạch mới",
    description: "Tạo kế hoạch KH-2026-012 cho Kho VL - A1",
    timestamp: "2026-01-12 13:15",
    icon: "Plus",
  },
  {
    id: 3,
    type: "vehicle_arrived",
    title: "Xe đã đến",
    description: "Xe 51C-12345 đã đến Kho SX - B1",
    timestamp: "2026-01-12 12:00",
    icon: "Truck",
  },
  {
    id: 4,
    type: "plan_started",
    title: "Kế hoạch bắt đầu",
    description: "Kế hoạch KH-2026-010 đã được bắt đầu thực hiện",
    timestamp: "2026-01-12 10:45",
    icon: "Play",
  },
  {
    id: 5,
    type: "vehicle_left",
    title: "Xe rời kho",
    description: "Xe 51C-54321 đã rời khỏi Kho TP - C1",
    timestamp: "2026-01-12 09:30",
    icon: "LogOut",
  },
];
