'use client';
import { useAuthStore } from '@/lib/store';
import { getRoleLabel } from '@/lib/utils';
import { Shield, Clock, Sliders } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Cài Đặt</h1>
      <div className="glass-card p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Thông Tin Tài Khoản</h2>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Họ tên', value: user?.fullName },
            { label: 'Email', value: user?.email },
            { label: 'Mã nhân viên', value: user?.code },
            { label: 'Quyền hạn', value: getRoleLabel(user?.role || '') },
            { label: 'Phòng ban', value: user?.department?.name },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Sliders className="w-4 h-4 text-primary" /> Thông Tin Hệ Thống</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>✅ AI Service: InsightFace buffalo_sc (CPU mode)</p>
          <p>✅ Database: PostgreSQL 16</p>
          <p>✅ Cache: Redis 7</p>
          <p>✅ Storage: MinIO</p>
          <p className="text-xs mt-3">Phiên bản: 1.0.0 · © 2024 DiemDanh</p>
        </div>
      </div>
    </div>
  );
}
