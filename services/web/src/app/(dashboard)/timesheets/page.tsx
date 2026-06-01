'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, departmentApi, reportApi } from '@/lib/api';
import { formatDate, getStatusConfig } from '@/lib/utils';
import { Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TimesheetsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [deptId, setDeptId] = useState('');
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(false);

  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: () => departmentApi.list().then(r => r.data) });
  const { data, isLoading } = useQuery({
    queryKey: ['attendance', month, deptId, page],
    queryFn: () => attendanceApi.all({ month, departmentId: deptId, page, limit: 20 }).then(r => r.data),
  });

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await reportApi.exportExcel(month, deptId);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `BaoCao_${month}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống báo cáo Excel!');
    } catch { toast.error('Lỗi xuất báo cáo'); }
    finally { setDownloading(false); }
  };

  const records = data?.data || [];

  const prevMonth = () => {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() - 1);
    setMonth(d.toISOString().slice(0, 7));
    setPage(1);
  };
  const nextMonth = () => {
    const d = new Date(month + '-01');
    d.setMonth(d.getMonth() + 1);
    setMonth(d.toISOString().slice(0, 7));
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Chấm Công</h1>
        <button onClick={handleExport} disabled={downloading}
          className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" />
          {downloading ? 'Đang xuất...' : 'Xuất Excel'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2 glass-card px-3 py-2">
          <button onClick={prevMonth} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium text-foreground text-sm min-w-[80px] text-center">
            {new Date(month + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <select value={deptId} onChange={(e) => { setDeptId(e.target.value); setPage(1); }} className="input-field w-auto min-w-[160px]">
          <option value="">Tất cả phòng ban</option>
          {depts?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                {['Ngày', 'Nhân Viên', 'Phòng Ban', 'Giờ Vào', 'Giờ Ra', 'Số Giờ', 'Trạng Thái', 'Ghi Chú'].map(h => (
                  <th key={h} className="text-left text-muted-foreground font-medium py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-4 bg-border rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">Không có dữ liệu</td></tr>
              ) : (
                records.map((r: any) => {
                  const cfg = getStatusConfig(r.status);
                  const workH = r.workMinutes ? `${Math.floor(r.workMinutes / 60)}h${r.workMinutes % 60 > 0 ? r.workMinutes % 60 + 'p' : ''}` : '—';
                  return (
                    <tr key={r.id} className="hover:bg-accent/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-foreground whitespace-nowrap">
                        {formatDate(r.date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                        {r.employee?.fullName}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {r.employee?.department?.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground">
                        {r.checkInTime ? formatDate(r.checkInTime, 'HH:mm') : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground">
                        {r.checkOutTime ? formatDate(r.checkOutTime, 'HH:mm') : '—'}
                      </td>
                      <td className="py-3 px-4 text-foreground">{workH}</td>
                      <td className="py-3 px-4">
                        <span className={cfg.className}>{cfg.label}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{r.note || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {data.total} bản ghi · Trang {page}/{data.totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-1.5 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary p-1.5 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
