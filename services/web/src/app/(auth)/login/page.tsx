'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Scan, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('Admin@123456');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Chào mừng, ${data.user.fullName}!`);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(263 85% 65%) 1px, transparent 1px), linear-gradient(90deg, hsl(263 85% 65%) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }} />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 relative"
            style={{ background: 'linear-gradient(135deg, hsl(263,85%,35%), hsl(220,85%,45%))' }}>
            <Scan className="w-10 h-10 text-white" />
            <div className="absolute inset-0 rounded-2xl animate-pulse-ring opacity-50"
              style={{ boxShadow: '0 0 0 8px hsla(263,85%,65%,0.15)' }} />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">DiemDanh</h1>
          <p className="text-muted-foreground text-sm">Hệ Thống Điểm Danh Nhận Diện Khuôn Mặt</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-semibold text-foreground mb-6">Đăng Nhập</h2>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="email@company.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Mật Khẩu</label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" id="login-btn" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Đang đăng nhập...</>) : 'Đăng Nhập'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Tài khoản demo</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Admin', email: 'admin@company.com', pw: 'Admin@123456' },
                { label: 'Nhân Viên', email: 'an.nguyen@company.com', pw: 'Employee@123' },
              ].map((acc) => (
                <button key={acc.label}
                  onClick={() => { setEmail(acc.email); setPassword(acc.pw); }}
                  className="text-xs py-2 px-3 rounded-lg bg-accent border border-border hover:border-primary/30 hover:text-primary transition-all duration-200 text-muted-foreground">
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 DiemDanh — Face Recognition Attendance System
        </p>
      </div>
    </div>
  );
}
