import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../contexts/AuthContext";
import {
  House,
  Tags,
  Package,
  Truck,
  Warehouse,
  CalendarRange,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";

// Simple Header Component
const Header = ({ currentPage = "Trang chủ", menu }) => {
  const navigate = useNavigate();
  // const { logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Menu Admin
  const adminMenu = [
    {
      label: "Trang chủ",
      icon: House,
      path: "/trang-chu",
    },
    {
      label: "Danh mục",
      icon: Tags,
      path: "/danh-muc",
    },
    {
      label: "Hàng hóa",
      icon: Package,
      path: "/hang-hoa",
    },
    {
      label: "Phương tiện",
      icon: Truck,
      path: "/phuong-tien",
    },
    {
      label: "Kho hàng",
      icon: Warehouse,
      path: "/kho-hang",
    },
    {
      label: "Kế hoạch",
      icon: CalendarRange,
      path: "/ke-hoach",
    },
    {
      label: "Cài đặt",
      icon: Settings,
      path: "/cai-dat",
    },
  ];

  const menuMap = {
    admin: adminMenu,
  };

  const items = menuMap[menu] || [];

  const handleNavigation = (item) => {
    navigate(item.path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    // await logout();
  };

  return (
    <div className="py-2 bg-indigo-600 overflow-hidden">
      <div className="max-w-7xl mx-auto px-2">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between py-1">
          {/* Menu trái */}
          <nav className="flex gap-2">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.label;

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item)}
                  className={`
                flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 cursor-pointer
                ${
                  isActive
                    ? "bg-white text-indigo-600 shadow-md"
                    : "text-white hover:bg-white/10"
                }
              `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Nút Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 text-white hover:bg-white/10 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          {/* Mobile Header */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 text-white">
              <span className="font-bold text-lg">Menu</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2 hover:bg-white/10 rounded-lg transition"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="pb-4 space-y-2">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.label;

                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item)}
                    className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium
            ${
              isActive
                ? "bg-white text-indigo-600 shadow-md"
                : "text-white hover:bg-white/10"
            }
          `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Nút Logout Mobile */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-lg text-white hover:bg-white/10 transition"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
