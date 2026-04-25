import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Package,
  PlusCircle,
  ClipboardList,
  Settings,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  LineChart,
  Truck,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Bảng điều khiển" },
  { to: "/products", icon: Package, label: "Mặt hàng" },
  { to: "/product-categories", icon: Tag, label: "Danh mục sản phẩm" },
  { to: "/new-plan", icon: PlusCircle, label: "Kỳ kế hoạch mới" },
  { to: "/consumption", icon: ClipboardList, label: "Nhập tiêu thụ" },
  { to: "/forecast", icon: LineChart, label: "Import & Dự đoán" },
  { to: "/suppliers", icon: Truck, label: "Nhà cung cấp" },
  { to: "/settings", icon: Settings, label: "Cấu hình kho" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar flex flex-col transition-all duration-300 border-r border-sidebar-border",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <Warehouse className="h-7 w-7 text-sidebar-primary flex-shrink-0" />
          {!collapsed && (
            <span className="text-sidebar-primary font-semibold text-lg truncate">
              Quản lý Dự trữ
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                location.pathname === item.to
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-primary transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
