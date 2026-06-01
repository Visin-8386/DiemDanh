'use client';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/lib/api';
import { formatDate, getStatusConfig } from '@/lib/utils';
import { Users, Clock, UserX, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6'];

function StatCard({ title, value, icon: Icon, color, sub }: any) {
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className={`text-4xl font-bold mt-2 ${color}`}>{value ?? '—'}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('-400', '-500/15')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportApi.dashboard().then((r) => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-32 animate-pulse">
              <div className="h-4 bg-border rounded w-2/3 mb-3" />
              <div className="h-10 bg-border rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data || {};
  const pieData = [
    { name: 'Đúng Giờ', value: stats.todayDistribution?.present || 0 },
    { name: 'Đi Muộn',  value: stats.todayDistribution?.late || 0 },
    { name: 'Vắng Mặt', value: stats.todayDistribution?.absent || 0 },
    { name: 'Nghỉ Phép', value: stats.todayDistribution?.leave || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tổng Quan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-2 btn-secondary text-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Có Mặt Hôm Nay" value={`${stats.attendanceRate || 0}%`}
          icon={CheckCircle} color="text-green-400" sub={`${stats.presentToday || 0} / ${stats.totalEmployees || 0} người`} />
        <StatCard title="Đi Muộn" value={stats.lateToday || 0}
          icon={Clock} color="text-yellow-400" sub="người đi muộn hôm nay" />
        <StatCard title="Vắng Mặt" value={stats.absentToday || 0}
          icon={UserX} color="text-red-400" sub="chưa điểm danh" />
        <StatCard title="Chờ Duyệt" value={stats.pendingLeave || 0}
          icon={TrendingUp} color="text-blue-400" sub="đơn nghỉ phép" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Line Chart */}
        <div className="lg:col-span-3 glass-card p-5">
          <h2 className="font-semibold text-foreground mb-4">Tỷ Lệ Có Mặt 7 Ngày Qua</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.last7Days || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="rate" name="Tỷ lệ %" stroke="hsl(263 85% 65%)"
                strokeWidth={2.5} dot={{ fill: 'hsl(263 85% 65%)', r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(263 85% 65%)', stroke: 'hsl(222 47% 8%)', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h2 className="font-semibold text-foreground mb-4">Phân Bố Hôm Nay</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: 'hsl(213 31% 91%)', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu hôm nay</div>
          )}
        </div>
      </div>

      {/* Recent Check-ins */}
      <div className="glass-card p-5">
        <h2 className="font-semibold text-foreground mb-4">Check-in Gần Đây</h2>
        {(!stats.recentCheckins || stats.recentCheckins.length === 0) ? (
          <p className="text-muted-foreground text-sm text-center py-8">Chưa có ai điểm danh hôm nay</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Nhân Viên', 'Phòng Ban', 'Giờ Vào', 'Trạng Thái'].map((h) => (
                    <th key={h} className="text-left text-muted-foreground font-medium pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {stats.recentCheckins.map((r: any) => {
                  const cfg = getStatusConfig(r.status);
                  return (
                    <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                      <td className="py-3 pr-4 font-medium text-foreground">{r.employee?.fullName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{r.employee?.department?.name}</td>
                      <td className="py-3 pr-4 font-mono text-foreground">
                        {r.checkInTime ? formatDate(r.checkInTime, 'HH:mm') : '—'}
                      </td>
                      <td className="py-3">
                        <span className={cfg.className}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
