import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Layout/Header";
import Sidebar from "../components/Layout/Sidebar";
import Footer from "../components/Layout/Footer";
import CommandPalette from "../components/Common/CommandPalette";

const DashboardLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
    } else {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Command Palette */}
      <CommandPalette />

      {/* Header (Fixed at top) */}
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Fixed left on desktop, Drawer on mobile) */}
        <Sidebar
          isOpen={isMobileSidebarOpen}
          isDesktopOpen={isDesktopSidebarOpen}
          closeSidebar={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto flex flex-col w-full">
          {/* Outlet: Where Dashboard/Projects pages render */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
