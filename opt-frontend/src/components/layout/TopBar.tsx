import { Search, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TopBar() {
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
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
          AD
        </div>
      </div>
    </header>
  );
}
