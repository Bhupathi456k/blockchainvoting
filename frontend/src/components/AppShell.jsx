import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import { ToastProvider } from './ui/Toast';
import { useAuth } from '../context/AuthContext';

const AppShell = ({ children }) => {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Sidebar for Authenticated Users */}
        {user && (
          <Sidebar
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className={`flex-1 transition-all duration-300 ${user ? 'lg:pl-64' : ''}`}>
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in">
            {children}
          </div>
        </main>

        {/* Command Palette Modal */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
      </div>
    </ToastProvider>
  );
};

export default AppShell;
