import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ClipboardList,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  Truck,
  Tag,
  Boxes,
  History,
  Settings,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getAccessibleRoutes } from "@/config/roleAccess";

const iconMap: Record<string, any> = {
  "Bảng điều khiển": LayoutDashboard,
  "Mặt hàng": Package,
  "Danh mục sản phẩm": Tag,
  "Kỳ kế hoạch mới": PlusCircle,
  "Nhập tiêu thụ": ClipboardList,
  "Nhà cung cấp": Truck,
  "Nhân viên": User,
  "Kho hàng": Boxes,
  "Lịch sử Nhập/Xuất": History,
};

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const { roles } = useAuth();

  // Get accessible routes based on user role
  const userRole = roles?.[0] || null;
  const accessibleRoutes = getAccessibleRoutes(userRole);

  // Filter out routes with parameters (like /products/:id, /suppliers/:id)
  const navItems = accessibleRoutes
    .filter((route) => !route.path.includes(":"))
    .map((route) => ({
      to: route.path,
      icon: iconMap[route.label] || Package,
      label: route.label,
    }));

  return (
    <aside
      className={cn(
        "h-screen flex flex-col py-6 bg-white border-r border-gray-300 shadow-[2px_0_16px_rgba(0,0,0,0.04)] transition-all duration-300 z-50",
        expanded ? "w-64 px-4" : "w-16 items-center px-0 gap-6",
      )}
    >
      {/* Logo */}
      <div
        className={cn("flex items-center gap-3", expanded ? "px-2 mb-6" : "")}
      >
        <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.35)] shrink-0">
          <Warehouse className="w-5 h-5 text-white" />
        </div>
        {expanded && (
          <span className="font-display font-bold text-lg text-gray-900 truncate">
            Quản lý Dự trữ
          </span>
        )}
      </div>

      <nav
        className={cn(
          "flex flex-col gap-1 flex-1 w-full",
          expanded ? "" : "items-center",
        )}
      >
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={!expanded ? item.label : undefined}
              className={cn(
                "group relative flex items-center transition-all duration-150",
                expanded
                  ? "w-full px-3 py-2.5 rounded-xl gap-3"
                  : "w-10 h-10 rounded-xl justify-center",
                active
                  ? "bg-primary-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)]"
                  : "text-gray-700 hover:bg-primary-50 hover:text-primary-600",
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {expanded && (
                <span className="font-medium text-sm truncate">
                  {item.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {!expanded && (
                <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div
        className={cn(
          "flex flex-col gap-2 w-full mt-auto",
          expanded ? "" : "items-center",
        )}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "group relative flex items-center transition-all duration-150 text-gray-400 hover:bg-gray-50 hover:text-gray-600",
            expanded
              ? "w-full px-3 py-2.5 rounded-xl gap-3"
              : "w-10 h-10 rounded-xl justify-center",
          )}
        >
          {expanded ? (
            <ChevronLeft className="w-5 h-5 shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 shrink-0" />
          )}
          {expanded && <span className="font-medium text-sm">Thu gọn</span>}
          {!expanded && (
            <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Mở rộng
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
