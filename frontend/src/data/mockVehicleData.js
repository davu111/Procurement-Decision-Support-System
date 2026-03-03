// Vehicle status: waiting (chờ), loading (đang nhận hàng), completed (hoàn tất)
export const mockVehicles = [
  {
    id: 1,
    name: "Xe tải Hino 500",
    licensePlate: "51C-12345",
    type: "truck",
    vehicleStatus: "loading", // waiting, loading, completed
    inWarehouse: true, // có trong kho hay không
    currentLocation: "Kho VL - A1",
    currentPlan: "KH-2026-001",
    currentStateId: 4, // Đang bốc/dỡ
  },
  {
    id: 2,
    name: "Xe nâng Toyota",
    licensePlate: "XN-001",
    type: "forklift",
    vehicleStatus: "waiting",
    inWarehouse: true,
    currentLocation: "Kho SX - B1",
    currentPlan: "KH-2026-002",
    currentStateId: 3, // Đang chờ nhận hàng
  },
  {
    id: 3,
    name: "Xe van Hyundai",
    licensePlate: "30H-67890",
    type: "van",
    vehicleStatus: "completed",
    inWarehouse: false,
    currentLocation: "Ngoài kho",
    currentPlan: "KH-2026-003",
    currentStateId: 6, // Đã rời kho
  },
  {
    id: 4,
    name: "Xe nâng Komatsu",
    licensePlate: "XN-002",
    type: "forklift",
    vehicleStatus: "loading",
    inWarehouse: true,
    currentLocation: "Kho TP - C1",
    currentPlan: "KH-2026-004",
    currentStateId: 4, // Đang bốc/dỡ
  },
  {
    id: 5,
    name: "Xe tải Hino 300",
    licensePlate: "51C-54321",
    type: "truck",
    vehicleStatus: "waiting",
    inWarehouse: false,
    currentLocation: "Ngoài kho",
    currentPlan: "KH-2026-005",
    currentStateId: 1, // Chưa vào kho
  },
  {
    id: 6,
    name: "Xe ba gác",
    licensePlate: "29C-99999",
    type: "trailer",
    vehicleStatus: "completed",
    inWarehouse: false,
    currentLocation: "Ngoài kho",
    currentPlan: "KH-2026-006",
    currentStateId: 6, // Đã rời kho
  },
];

// Vehicle state timeline data
export const vehicleStateTimeline = [
  { id: 1, state: "Chưa vào kho", icon: "Clock", completed: false },
  { id: 2, state: "Đã vào kho tổng", icon: "CheckCircle", completed: false },
  { id: 3, state: "Đang chờ nhận hàng", icon: "AlertCircle", completed: false },
  { id: 4, state: "Đang bốc/dỡ", icon: "Zap", completed: false },
  { id: 5, state: "Hoàn tất", icon: "CheckCircle2", completed: false },
  { id: 6, state: "Đã rời kho", icon: "LogOut", completed: false },
];

// Vehicle plan details - lấy từ mockPlanData và xử lý tương ứng
export const vehiclePlanDetails = [
  {
    vehicleId: 1,
    planCode: "KH-2026-001",
    planName: "Nhập hàng vào Kho VL",
    warehouse: "Kho VL - A1",
    products: [
      { name: "Thép cuộn HRC", quantity: 150, unit: "tấn" },
      { name: "Thép tấm", quantity: 200, unit: "tấn" },
    ],
    driver: "Nguyễn Văn An",
    startDate: "2026-01-12 08:00",
    estimatedEndDate: "2026-01-12 14:00",
    progress: 60,
  },
  {
    vehicleId: 2,
    planCode: "KH-2026-002",
    planName: "Đón hàng từ Kho SX",
    warehouse: "Kho SX - B1",
    products: [
      { name: "Nhôm thanh", quantity: 80, unit: "kg" },
    ],
    driver: "Trần Văn Bình",
    startDate: "2026-01-12 09:30",
    estimatedEndDate: "2026-01-12 15:30",
    progress: 30,
  },
  {
    vehicleId: 3,
    planCode: "KH-2026-003",
    planName: "Xuất hàng từ Kho TP",
    warehouse: "Kho TP - C1",
    products: [
      { name: "Xi măng PCB40", quantity: 500, unit: "bao" },
      { name: "Ống nhựa PVC", quantity: 200, unit: "ống" },
    ],
    driver: "Lê Văn Cường",
    startDate: "2026-01-11 10:00",
    estimatedEndDate: "2026-01-11 16:00",
    progress: 100,
  },
  {
    vehicleId: 4,
    planCode: "KH-2026-004",
    planName: "Nhập hàng vào Kho TP",
    warehouse: "Kho TP - C1",
    products: [
      { name: "Gạch ống", quantity: 5000, unit: "viên" },
    ],
    driver: "Phạm Văn Dũng",
    startDate: "2026-01-12 07:00",
    estimatedEndDate: "2026-01-12 13:00",
    progress: 45,
  },
  {
    vehicleId: 5,
    planCode: "KH-2026-005",
    planName: "Đón hàng từ nhà cung cấp",
    warehouse: "Kho VL - A2",
    products: [
      { name: "Cát xây dựng", quantity: 150, unit: "m³" },
    ],
    driver: "Hoàng Văn Em",
    startDate: "2026-01-12 06:00",
    estimatedEndDate: "2026-01-12 12:00",
    progress: 20,
  },
  {
    vehicleId: 6,
    planCode: "KH-2026-006",
    planName: "Giao hàng cho khách hàng",
    warehouse: "Kho SX - B2",
    products: [
      { name: "Sắt phi 10", quantity: 300, unit: "cây" },
    ],
    driver: "Nguyễn Thị Hoa",
    startDate: "2026-01-10 08:00",
    estimatedEndDate: "2026-01-10 18:00",
    progress: 100,
  },
];