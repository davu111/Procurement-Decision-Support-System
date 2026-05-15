// Role-based access control configuration
export type UserRole = "admin" | "planning-manager" | "warehouse-manager";

export interface RouteAccess {
  path: string;
  label: string;
  roles: UserRole[];
  icon?: string;
}

export const ROUTE_ACCESS_CONFIG: RouteAccess[] = [
  // Dashboard - all roles
  {
    path: "/",
    label: "Trang chủ",
    roles: ["admin", "planning-manager", "warehouse-manager"],
  },

  // New Plan - planning-manager, admin
  {
    path: "/new-plan",
    label: "Kỳ kế hoạch mới",
    roles: ["admin", "planning-manager"],
  },

  // Warehouses - warehouse-manager, admin
  {
    path: "/warehouses",
    label: "Kho hàng",
    roles: ["admin", "warehouse-manager"],
  },

  // Transactions - warehouse-manager, admin
  {
    path: "/transactions",
    label: "Lịch sử Nhập/Xuất",
    roles: ["admin", "warehouse-manager"],
  },

  // Suppliers - warehouse-manager, admin
  {
    path: "/suppliers",
    label: "Nhà cung cấp",
    roles: ["admin", "warehouse-manager"],
  },
  {
    path: "/suppliers/:id",
    label: "Chi tiết Nhà cung cấp",
    roles: ["admin", "warehouse-manager"],
  },

  // Products - warehouse-manager, admin
  {
    path: "/products",
    label: "Mặt hàng",
    roles: ["admin", "warehouse-manager"],
  },
  {
    path: "/products/:id",
    label: "Chi tiết Mặt hàng",
    roles: ["admin", "warehouse-manager"],
  },

  // Product Categories - warehouse-manager, admin
  {
    path: "/product-categories",
    label: "Danh mục sản phẩm",
    roles: ["admin", "warehouse-manager"],
  },

  // Consumption - warehouse-manager, admin
  {
    path: "/consumption",
    label: "Nhập tiêu thụ",
    roles: ["admin", "warehouse-manager"],
  },

  // Employees - admin only
  {
    path: "/employees",
    label: "Nhân viên",
    roles: ["admin"],
  },
];

// Helper function to check if user has access to a route
export const canAccessRoute = (
  userRole: string | null,
  routePath: string,
): boolean => {
  if (!userRole) return false;

  // Admin has access to all routes
  if (userRole === "admin") return true;

  // Check if route exists in config
  const route = ROUTE_ACCESS_CONFIG.find((r) => {
    // Exact match
    if (r.path === routePath) return true;

    // Wildcard match (e.g., /suppliers/:id matches /suppliers/123)
    const pathRegex = r.path
      .replace(/:[^\s/]+/g, "[^/]+")
      .replace(/\//g, "\\/");
    return new RegExp(`^${pathRegex}$`).test(routePath);
  });

  if (!route) return false;
  return route.roles.includes(userRole as UserRole);
};

// Get accessible routes for a user
export const getAccessibleRoutes = (userRole: string | null): RouteAccess[] => {
  if (!userRole) return [];

  // Admin sees all routes
  if (userRole === "admin") return ROUTE_ACCESS_CONFIG;

  // Filter routes by role
  return ROUTE_ACCESS_CONFIG.filter((route) =>
    route.roles.includes(userRole as UserRole),
  );
};
