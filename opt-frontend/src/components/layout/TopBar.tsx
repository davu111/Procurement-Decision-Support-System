import { Search, Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";

export default function TopBar() {
  const { logout, userInfo } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="h-14 px-6 flex items-center justify-between border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        {/* We can put breadcrumbs or search here if needed */}
      </div>

      <div className="flex items-center gap-3">
        <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm text-gray-500 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all duration-150">
          <Search className="w-4 h-4" />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm text-gray-500 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all duration-150 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        {/* User Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0 hover:bg-primary-200 transition-colors cursor-pointer">
              {userInfo?.given_name?.charAt(0) || "U"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col space-y-1 py-2">
              <p className="text-sm font-semibold text-gray-900">
                {userInfo?.name || "Người dùng"}
              </p>
              <p className="text-xs text-gray-500">{userInfo?.email || ""}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => window.open("/profile", "_blank")}
              className="cursor-pointer"
            >
              <User className="w-4 h-4 mr-2" />
              <span>Hồ sơ cá nhân</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
