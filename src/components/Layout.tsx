import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileBarChart, 
  Wrench, 
  UserMinus,
  Settings,
  ShieldCheck, 
  ShieldAlert, // Added for Super Admin icon
  LogOut 
} from 'lucide-react';
import InstallButton from './InstallButton';
import UpdateHandler from './UpdateHandler';
// --- IMPORT SYNC STATUS ---
import SyncStatus from './SyncStatus';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/properties', label: 'Properties', icon: Building2 },
    { path: '/tenants', label: 'Tenants', icon: Users },
    { path: '/repairs', label: 'Repairs', icon: Wrench },
    { path: '/reports', label: 'Reports', icon: FileBarChart },
    { path: '/vacated', label: 'Vacated', icon: UserMinus },
    { path: '/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-blue-900 text-white flex-shrink-0 sticky top-0 h-screen hidden md:flex flex-col shadow-2xl">
        
        {/* Logo Section */}
        <div className="p-6 mb-2">
          <h1 
            className="font-bold uppercase leading-tight text-white"
            style={{ 
              fontSize: '18px', 
              letterSpacing: '0.01em',
              lineHeight: '1.1' 
            }}
          >
            Truvana Holdings.
          </h1>
          <div className="mt-4 pt-2 border-t border-blue-800/50 flex flex-col gap-3">
            <p className="text-[10px] text-blue-200/60 font-bold uppercase tracking-[0.2em]">
              Property Management
            </p>
            {/* SYNC STATUS PLACEMENT */}
            <SyncStatus />
          </div>
        </div>

        {/* Update Notification Section */}
        <UpdateHandler />

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-white hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={19} className={isActive ? 'text-white' : 'text-blue-300'} />
                {item.label}
              </Link>
            );
          })}

          {/* ADMIN ONLY: User Management */}
          {currentUser?.role === 'admin' && (
            <Link
              to="/users"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                location.pathname === '/users' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'text-purple-200 hover:bg-purple-500/10'
              }`}
            >
              <ShieldCheck size={19} className={location.pathname === '/users' ? 'text-white' : 'text-purple-400'} />
              User Management
            </Link>
          )}

          {/* SUPER ADMIN ONLY: Developer Portal */}
          {currentUser?.isSuperAdmin && (
            <Link
              to="/super-portal"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold mt-2 border border-amber-500/20 ${
                location.pathname === '/super-portal' 
                  ? 'bg-amber-600 text-white shadow-lg' 
                  : 'text-amber-200 bg-amber-500/5 hover:bg-amber-500/10'
              }`}
            >
              <ShieldAlert size={19} className={location.pathname === '/super-portal' ? 'text-white' : 'text-amber-400'} />
              Super Admin Portal
            </Link>
          )}
          
          <div className="pt-4 mt-4 border-t border-blue-800/30">
            <InstallButton />
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-5 border-t border-blue-800/50 space-y-3">
          <button
            onClick={() => {
              if(window.confirm("Are you sure you want to logout?")) logout();
            }}
            className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-red-500/20 text-red-400 py-3 rounded-xl text-xs font-bold transition border border-red-500/30 uppercase tracking-widest"
          >
            <LogOut size={16} />
            Sign Out
          </button>
          
          <div className="text-center">
            <p className="text-[10px] text-blue-300/40 font-medium italic">Logged in as {currentUser?.username}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
        <div className="p-10 max-w-[1600px] mx-auto text-left">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;