'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi, departmentApi } from '@/lib/api';
import { Download, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [deptId, setDeptId] = useState('');
  const [downloading, setDownloading] = useState(false);

  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: () => departmentApi.list().then(r => r.data) });
  const { data: summary, isLoading } = useQuery({
    queryKey: ['monthly-report', month, deptId],
    queryFn: () => reportApi.monthly(month, deptId).then(r => r.data),
  });

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await reportApi.exportExcel(month, deptId);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `BaoCao_${month}.xlsx`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống báo cáo!');
    } catch { toast.error('Lỗi xuất báo cáo'); }
    finally { setDownloading(false); }
  };

  const monthLabel = new Date(month + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const rows = summary || [];

  // Stats
  const totalPresent = rows.reduce((s: number, r: any) => s + r.present, 0);
  const totalLate = rows.reduce((s: number, r: any) => s + r.late, 0);
  const totalAbsent = rows.reduce((s: number, r: any) => s + r.absent, 0);

  // Bar chart data by department
  const deptMap: Record<string, any> = {};
  rows.forEach((r: any) => {
    const d = r.department || 'Khác';
    if (!deptMap[d]) deptMap[d] = { dept: d, present: 0, late: 0, absent: 0 };
    deptMap[d].present += r.present;
    deptMap[d].late += r.late;
    deptMap[d].absent += r.absent;
  });
  const chartData = Object.values(deptMap);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Báo Cáo</h1>
        <button onClick={handleExport} disabled={downloading} className="btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          {downloading ? 'Đang xuất...' : 'Xuất Excel'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2 glass-card px-3 py-2">
          <button onClick={() => { const d = new Date(month + '-01'); d.setMonth(d.getMonth() - 1); setMonth(d.toISOString().slice(0, 7)); }}
            className="text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-medium text-foreground text-sm min-w-[100px] text-center">{monthLabel}</span>
          <button onClick={() => { const d = new Date(month + '-01'); d.setMonth(d.getMonth() + 1); setMonth(d.toISOString().slice(0, 7)); }}
            className="text-muted-foreground hover:text-foreground"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className="input-field w-auto min-w-[160px]">
          <option value="">Tất cả phòng ban</option>
          {depts?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng Đúng Giờ', value: totalPresent, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Tổng Đi Muộn', value: totalLate, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Tổng Vắng Mặt', value: totalAbsent, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((s) => (
          <div key={s.label} className={`glass-card p-4 ${s.bg} border border-border/30`}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">lượt trong tháng</p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Thống Kê Theo Phòng Ban
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
              <XAxis dataKey="dept" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(222 47% 11%)', border: '1px solid hsl(216 34% 17%)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="present" name="Đúng giờ" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="late" name="Đi muộn" fill="#eab308" radius={[3, 3, 0, 0]} />
              <Bar dataKey="absent" name="Vắng" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detail Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Chi Tiết Nhân Viên</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/40">
                {['STT', 'Mã NV', 'Họ Tên', 'Phòng Ban', 'Ng. Công', 'Đúng Giờ', 'Đi Muộn', 'Vắng', 'Nghỉ', 'Giờ Làm', 'OT', 'Tỷ Lệ'].map(h => (
                  <th key={h} className="text-left text-muted-foreground font-medium py-3 px-3 whitespace-nowrap text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(12)].map((_, j) => <td key={j} className="py-3 px-3"><div className="h-3 bg-border rounded animate-pulse" /></td>)}</tr>
                ))
              ) : rows.map((r: any, i: number) => (
                <tr key={r.employeeId} className={`hover:bg-accent/20 transition-colors ${i % 2 === 0 ? '' : 'bg-accent/10'}`}>
                  <td className="py-2.5 px-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-2.5 px-3 font-mono text-foreground">{r.code}</td>
                  <td className="py-2.5 px-3 font-medium text-foreground whitespace-nowrap">{r.fullName}</td>
                  <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{r.department}</td>
                  <td className="py-2.5 px-3 text-center text-foreground">{r.workDays}</td>
                  <td className="py-2.5 px-3 text-center text-green-400 font-semibold">{r.present}</td>
                  <td className="py-2.5 px-3 text-center text-yellow-400 font-semibold">{r.late}</td>
                  <td className="py-2.5 px-3 text-center text-red-400 font-semibold">{r.absent}</td>
                  <td className="py-2.5 px-3 text-center text-blue-400">{r.leave}</td>
                  <td className="py-2.5 px-3 text-center text-foreground">{r.totalWorkHours}h</td>
                  <td className="py-2.5 px-3 text-center text-purple-400">{r.overtimeHours}h</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-semibold ${r.attendanceRate >= 90 ? 'text-green-400' : r.attendanceRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {r.attendanceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
