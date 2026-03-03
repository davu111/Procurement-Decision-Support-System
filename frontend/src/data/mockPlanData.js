// Mock data for plans with complete task information
export const mockPlans = [
  {
    id: 1,
    planName: "Dự án Website A",
    color: "bg-blue-500",
    startDate: new Date(2026, 0, 6),
    endDate: new Date(2026, 0, 12),
    notes: "Phát triển frontend website A với React",
    status: "in-progress", // pending, in-progress, completed
    vehiclePlans: [
      {
        id: 1,
        licensePlate: "51A-001.23",
        purpose: "VL",
        allowedAreas: ["Kho VL"],
        driverId: 1,
        driverName: "Nguyễn Văn An",
        passengers: [
          { id: 6, name: "Nguyễn Thị Hoa" },
        ],
        detailPlans: [
          {
            id: 1,
            workType: "nhap",
            warehouses: [
              {
                id: 1,
                warehouseId: 1,
                warehouseName: "Kho VL - A1",
                products: [
                  { id: 1, name: "Thép cuộn HRC", quantity: 5 },
                  { id: 2, name: "Thép tấm", quantity: 3 },
                ],
              },
            ],
          },
        ],
        expanded: true,
      },
    ],
  },
  {
    id: 31,
    planName: "Dự án Website A (Bản sao 1)",
    color: "bg-purple-500",
    startDate: new Date(2026, 0, 6),
    endDate: new Date(2026, 0, 15),
    notes: "Bản sao của dự án Website A",
    status: "in-progress",
    vehiclePlans: [
      {
        id: 2,
        licensePlate: "51A-002.23",
        purpose: "VL",
        allowedAreas: ["Kho VL"],
        driverId: 2,
        driverName: "Trần Văn Bình",
        passengers: [],
        detailPlans: [],
        expanded: true,
      },
    ],
  },
  {
    id: 32,
    planName: "Dự án Website A (Bản sao 2)",
    color: "bg-green-500",
    startDate: new Date(2026, 0, 6),
    endDate: new Date(2026, 0, 16),
    notes: "Bản sao thứ 2 của dự án Website A",
    status: "completed",
    vehiclePlans: [
      {
        id: 3,
        licensePlate: "51A-003.23",
        purpose: "VL",
        allowedAreas: ["Kho VL"],
        driverId: 3,
        driverName: "Lê Văn Cường",
        passengers: [],
        detailPlans: [],
        expanded: true,
      },
    ],
  },
  {
    id: 33,
    planName: "Dự án Website A (Bản sao 3)",
    color: "bg-red-500",
    startDate: new Date(2026, 0, 6),
    endDate: new Date(2026, 0, 12),
    notes: "Bản sao thứ 3 của dự án Website A",
    status: "pending",
    vehiclePlans: [
      {
        id: 4,
        licensePlate: "51A-004.23",
        purpose: "VL",
        allowedAreas: ["Kho VL"],
        driverId: 4,
        driverName: "Phạm Văn Dũng",
        passengers: [],
        detailPlans: [],
        expanded: true,
      },
    ],
  },
  {
    id: 34,
    planName: "Dự án Website A (Bản sao 4)",
    color: "bg-yellow-500",
    startDate: new Date(2026, 0, 6),
    endDate: new Date(2026, 0, 12),
    notes: "Bản sao thứ 4 của dự án Website A",
    status: "pending",
    vehiclePlans: [
      {
        id: 5,
        licensePlate: "51A-005.23",
        purpose: "VL",
        allowedAreas: ["Kho VL"],
        driverId: 5,
        driverName: "Hoàng Văn Em",
        passengers: [],
        detailPlans: [],
        expanded: true,
      },
    ],
  },
  {
    id: 45,
    planName: "Dự án Mobile App",
    color: "bg-cyan-500",
    startDate: new Date(2026, 0, 15),
    endDate: new Date(2026, 0, 25),
    notes: "Phát triển ứng dụng di động cho nền tảng iOS/Android",
    status: "in-progress",
    vehiclePlans: [
      {
        id: 10,
        licensePlate: "51F-050.34",
        purpose: "SX",
        allowedAreas: ["Kho SX"],
        driverId: 4,
        driverName: "Phạm Văn Dũng",
        passengers: [
          { id: 5, name: "Hoàng Văn Em" },
          { id: 8, name: "Lê Thị Mai" },
        ],
        detailPlans: [
          {
            id: 4,
            workType: "nhap",
            warehouses: [
              {
                id: 4,
                warehouseId: 4,
                warehouseName: "Kho SX - B2",
                products: [
                  { id: 3, name: "Nhôm thanh", quantity: 50 },
                  { id: 4, name: "Đồng thỏi", quantity: 25 },
                ],
              },
            ],
          },
        ],
        expanded: true,
      },
    ],
  },
  {
    id: 2,
    planName: "Meeting Client B",
    color: "bg-pink-500",
    startDate: new Date(2026, 0, 8),
    endDate: new Date(2026, 0, 8),
    notes: "Cuộc họp với Client B để thảo luận yêu cầu dự án",
    status: "completed",
    vehiclePlans: [
      {
        id: 6,
        licensePlate: "51B-010.45",
        purpose: "VL",
        allowedAreas: ["Kho VL", "Kho SX"],
        driverId: 7,
        driverName: "Trần Thị Lan",
        passengers: [
          { id: 1, name: "Nguyễn Văn An" },
        ],
        detailPlans: [],
        expanded: true,
      },
    ],
  },
  {
    id: 3,
    planName: "Code Review Sprint 1",
    color: "bg-indigo-500",
    startDate: new Date(2026, 0, 9),
    endDate: new Date(2026, 0, 21),
    notes: "Review code cho Sprint 1 của dự án",
    status: "in-progress",
    vehiclePlans: [
      {
        id: 7,
        licensePlate: "51C-020.67",
        purpose: "SX",
        allowedAreas: ["Kho SX"],
        driverId: 2,
        driverName: "Trần Văn Bình",
        passengers: [
          { id: 7, name: "Trần Thị Lan" },
          { id: 8, name: "Lê Thị Mai" },
        ],
        detailPlans: [
          {
            id: 2,
            workType: "xuat",
            warehouses: [
              {
                id: 2,
                warehouseId: 3,
                warehouseName: "Kho SX - B1",
                products: [
                  { id: 5, name: "Xi măng PCB40", quantity: 10 },
                ],
              },
            ],
          },
        ],
        expanded: true,
      },
    ],
  },
  {
    id: 4,
    planName: "Training Session",
    color: "bg-teal-500",
    startDate: new Date(2026, 0, 10),
    endDate: new Date(2026, 0, 11),
    notes: "Đào tạo nhân viên mới về quy trình làm việc",
    status: "pending",
    vehiclePlans: [
      {
        id: 8,
        licensePlate: "51D-030.89",
        purpose: "TP",
        allowedAreas: ["Kho TP"],
        driverId: 6,
        driverName: "Nguyễn Thị Hoa",
        passengers: [],
        detailPlans: [
          {
            id: 3,
            workType: "nhap",
            warehouses: [
              {
                id: 3,
                warehouseId: 5,
                warehouseName: "Kho TP - C1",
                products: [
                  { id: 7, name: "Gạch ống", quantity: 500 },
                  { id: 8, name: "Sắt phi 10", quantity: 100 },
                ],
              },
            ],
          },
        ],
        expanded: true,
      },
    ],
  },
  {
    id: 5,
    planName: "Báo cáo tháng",
    color: "bg-orange-500",
    startDate: new Date(2026, 0, 13),
    endDate: new Date(2026, 0, 14),
    notes: "Lập báo cáo kết quả hoạt động tháng 1",
    status: "completed",
    vehiclePlans: [
      {
        id: 9,
        licensePlate: "51E-040.12",
        purpose: "VL",
        allowedAreas: ["Kho VL", "Kho SX", "Kho TP"],
        driverId: 3,
        driverName: "Lê Văn Cường",
        passengers: [
          { id: 2, name: "Trần Văn Bình" },
        ],
        detailPlans: [],
        expanded: true,
      },
    ],
  },
  {
    id: 9,
    planName: "Client Meeting C",
    color: "bg-rose-500",
    startDate: new Date(2026, 0, 20),
    endDate: new Date(2026, 0, 20),
    notes: "Cuộc họp báo cáo tiến độ dự án với Client C",
    status: "pending",
    vehiclePlans: [
      {
        id: 13,
        licensePlate: "51I-080.90",
        purpose: "SX",
        allowedAreas: ["Kho SX"],
        driverId: 7,
        driverName: "Trần Thị Lan",
        passengers: [
          { id: 6, name: "Nguyễn Thị Hoa" },
        ],
        detailPlans: [],
        expanded: true,
      },
    ],
  },
  {
    id: 11,
    planName: "Kiểm tra kho hàng",
    color: "bg-fuchsia-500",
    startDate: new Date(2026, 0, 10),
    endDate: new Date(2026, 0, 10),
    notes: "Kiểm tra tổng quát các kho hàng để đảm bảo an toàn",
    status: "in-progress",
    vehiclePlans: [
      {
        id: 15,
        licensePlate: "51K-101.11",
        purpose: "VL",
        allowedAreas: ["Kho VL", "Kho SX", "Kho TP"],
        driverId: 4,
        driverName: "Phạm Văn Dũng",
        passengers: [],
        detailPlans: [],
        expanded: true,
      },
    ],
  },
  {
    id: 12,
    planName: "Nhập hàng mới",
    color: "bg-sky-500",
    startDate: new Date(2026, 0, 10),
    endDate: new Date(2026, 0, 12),
    notes: "Nhập hàng nguyên liệu mới từ nhà cung cấp",
    status: "in-progress",
    vehiclePlans: [
      {
        id: 16,
        licensePlate: "51L-111.22",
        purpose: "VL",
        allowedAreas: ["Kho VL"],
        driverId: 2,
        driverName: "Trần Văn Bình",
        passengers: [
          { id: 6, name: "Nguyễn Thị Hoa" },
        ],
        detailPlans: [
          {
            id: 7,
            workType: "nhap",
            warehouses: [
              {
                id: 7,
                warehouseId: 1,
                warehouseName: "Kho VL - A1",
                products: [
                  { id: 1, name: "Thép cuộn HRC", quantity: 15 },
                  { id: 2, name: "Thép tấm", quantity: 10 },
                  { id: 3, name: "Nhôm thanh", quantity: 8 },
                ],
              },
            ],
          },
        ],
        expanded: true,
      },
    ],
  },
  {
    id: 13,
    planName: "Kiểm kê tồn kho",
    color: "bg-amber-500",
    startDate: new Date(2026, 0, 10),
    endDate: new Date(2026, 0, 11),
    notes: "Thực hiện kiểm kê định kỳ tồn kho tháng 1",
    status: "completed",
    vehiclePlans: [
      {
        id: 17,
        licensePlate: "51M-121.33",
        purpose: "SX",
        allowedAreas: ["Kho SX"],
        driverId: 3,
        driverName: "Lê Văn Cường",
        passengers: [
          { id: 8, name: "Lê Thị Mai" },
        ],
        detailPlans: [
          {
            id: 8,
            workType: "xuat",
            warehouses: [
              {
                id: 8,
                warehouseId: 4,
                warehouseName: "Kho SX - B2",
                products: [
                  { id: 5, name: "Xi măng PCB40", quantity: 5 },
                ],
              },
            ],
          },
        ],
        expanded: true,
      },
    ],
  },
  {
    id: 21,
    planName: "Kiểm kê tồn kho 2",
    color: "bg-slate-500",
    startDate: new Date(2026, 0, 10),
    endDate: new Date(2026, 0, 11),
    notes: "Kiểm kê tồn kho lần thứ 2 cho khu vực TP",
    status: "completed",
    vehiclePlans: [
      {
        id: 18,
        licensePlate: "51N-131.44",
        purpose: "TP",
        allowedAreas: ["Kho TP"],
        driverId: 6,
        driverName: "Nguyễn Thị Hoa",
        passengers: [
          { id: 4, name: "Phạm Văn Dũng" },
        ],
        detailPlans: [
          {
            id: 9,
            workType: "nhap",
            warehouses: [
              {
                id: 9,
                warehouseId: 6,
                warehouseName: "Kho TP - C2",
                products: [
                  { id: 7, name: "Gạch ống", quantity: 1000 },
                ],
              },
            ],
          },
        ],
        expanded: true,
      },
    ],
  },
  {
    id: 14,
    planName: "Bảo trì hệ thống",
    color: "bg-stone-500",
    startDate: new Date(2026, 0, 20),
    endDate: new Date(2026, 0, 20),
    notes: "Bảo trì hệ thống điều hòa và hệ thống điện",
    status: "pending",
    vehiclePlans: [
      {
        id: 19,
        licensePlate: "51O-141.55",
        purpose: "VL",
        allowedAreas: ["Kho VL", "Kho SX"],
        driverId: 7,
        driverName: "Trần Thị Lan",
        passengers: [],
        detailPlans: [],
        expanded: true,
      },
    ],
  },
  {
    id: 15,
    planName: "Sửa chữa thiết bị",
    color: "bg-red-600",
    startDate: new Date(2026, 0, 20),
    endDate: new Date(2026, 0, 21),
    notes: "Sửa chữa máy móc thiết bị bị hỏng trong kho",
    status: "pending",
    vehiclePlans: [
      {
        id: 20,
        licensePlate: "51P-151.66",
        purpose: "SX",
        allowedAreas: ["Kho SX"],
        driverId: 8,
        driverName: "Lê Thị Mai",
        passengers: [
          { id: 3, name: "Lê Văn Cường" },
        ],
        detailPlans: [
          {
            id: 10,
            workType: "xuat",
            warehouses: [
              {
                id: 10,
                warehouseId: 3,
                warehouseName: "Kho SX - B1",
                products: [
                  { id: 8, name: "Sắt phi 10", quantity: 50 },
                  { id: 9, name: "Ống nhựa PVC", quantity: 100 },
                ],
              },
            ],
          },
        ],
        expanded: true,
      },
    ],
  },
  {
    id: 10,
    planName: "Deploy Production",
    color: "bg-violet-500",
    startDate: new Date(2026, 0, 23),
    endDate: new Date(2026, 0, 25),
    notes: "Triển khai phiên bản chính thức lên máy chủ production",
    status: "completed",
    vehiclePlans: [
      {
        id: 14,
        licensePlate: "51J-090.01",
        purpose: "TP",
        allowedAreas: ["Kho TP"],
        driverId: 5,
        driverName: "Hoàng Văn Em",
        passengers: [
          { id: 1, name: "Nguyễn Văn An" },
          { id: 2, name: "Trần Văn Bình" },
        ],
        detailPlans: [
          {
            id: 6,
            workType: "nhap",
            warehouses: [
              {
                id: 6,
                warehouseId: 6,
                warehouseName: "Kho TP - C2",
                products: [
                  { id: 1, name: "Thép cuộn HRC", quantity: 10 },
                  { id: 6, name: "Cát xây dựng", quantity: 20 },
                ],
              },
            ],
          },
        ],
        expanded: true,
      },
    ],
  },
  {
    id: 7,
    planName: "Workshop Design",
    color: "bg-lime-500",
    startDate: new Date(2026, 0, 17),
    endDate: new Date(2026, 0, 20),
    notes: "Hội thảo thiết kế UI/UX cho dự án mới",
    status: "in-progress",
    vehiclePlans: [
      {
        id: 11,
        licensePlate: "51G-060.56",
        purpose: "TP",
        allowedAreas: ["Kho TP"],
        driverId: 8,
        driverName: "Lê Thị Mai",
        passengers: [
          { id: 4, name: "Phạm Văn Dũng" },
        ],
        detailPlans: [],
        expanded: true,
      },
    ],
  },
  {
    id: 8,
    planName: "Testing Phase",
    color: "bg-emerald-500",
    startDate: new Date(2026, 0, 16),
    endDate: new Date(2026, 0, 27),
    notes: "Giai đoạn test chất lượng sản phẩm",
    status: "in-progress",
    vehiclePlans: [
      {
        id: 12,
        licensePlate: "51H-070.78",
        purpose: "VL",
        allowedAreas: ["Kho VL"],
        driverId: 1,
        driverName: "Nguyễn Văn An",
        passengers: [
          { id: 3, name: "Lê Văn Cường" },
          { id: 7, name: "Trần Thị Lan" },
        ],
        detailPlans: [
          {
            id: 5,
            workType: "xuat",
            warehouses: [
              {
                id: 5,
                warehouseId: 2,
                warehouseName: "Kho VL - A2",
                products: [
                  { id: 9, name: "Ống nhựa PVC", quantity: 200 },
                  { id: 10, name: "Dây điện 2.5mm", quantity: 50 },
                ],
              },
            ],
          },
        ],
        expanded: true,
      },
    ],
  },
];