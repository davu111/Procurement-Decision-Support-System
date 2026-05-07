import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex flex-col relative">
        <TopBar />
        <div className="p-6 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
