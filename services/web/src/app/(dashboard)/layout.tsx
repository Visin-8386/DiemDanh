'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { getRoleLabel, getInitials } from '@/lib/utils';
import {
  LayoutDashboard, Camera, Users, CalendarCheck, FileText,
  BarChart3, Settings, LogOut, Scan, Bell, ChevronDown, Menu, X
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',   label: 'Tổng Quan',    icon: LayoutDashboard, roles: ['all'] },
  { href: '/attendance',  label: 'Điểm Danh',    icon: Camera,          roles: ['all'] },
  { href: '/employees',   label: 'Nhân Viên',     icon: Users,           roles: ['HR_MANAGER', 'SUPER_ADMIN'] },
  { href: '/timesheets',  label: 'Chấm Công',     icon: CalendarCheck,   roles: ['all'] },
  { href: '/leave',       label: 'Đơn Nghỉ Phép', icon: FileText,        roles: ['all'] },
  { href: '/reports',     label: 'Báo Cáo',       icon: BarChart3,       roles: ['HR_MANAGER', 'SUPER_ADMIN', 'DEPARTMENT_HEAD'] },
  { href: '/settings',    label: 'Cài Đặt',       icon: Settings,        roles: ['SUPER_ADMIN'] },
];


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [time, setTime] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Zustand persist có thể chưa hydrate kịp khi useEffect chạy trong Next.js 13+
    // → dùng localStorage làm fallback để tránh redirect nhầm
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token');
    if (!isAuthenticated() && !hasToken) { router.push('/login'); return; }
    const tick = () => setTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const visibleNav = navItems.filter((item) =>
    item.roles.includes('all') || item.roles.includes(user?.role || ''),
  );

  const Sidebar = () => (
    <aside className="flex flex-col h-full glass-card rounded-none border-r border-border/50 bg-card/95 w-64 shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(263,85%,45%), hsl(220,85%,50%))' }}>
            <Scan className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-base leading-none">DiemDanh</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Face Recognition System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-4 py-4 border-b border-border/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50 border border-border/30">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(263,85%,50%), hsl(220,85%,50%))' }}>
              {getInitials(user.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground truncate">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={`sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border/50">
        <button onClick={handleLogout} id="logout-btn"
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" />
          <span>Đăng Xuất</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="shrink-0 h-16 glass-card rounded-none border-b border-border/50 flex items-center px-4 md:px-6 gap-4">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent border border-border text-sm text-foreground font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {time}
            </div>
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
