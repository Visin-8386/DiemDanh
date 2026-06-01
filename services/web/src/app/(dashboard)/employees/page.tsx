'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi, departmentApi, shiftApi, faceApi } from '@/lib/api';
import { getInitials, getRoleLabel, formatDate } from '@/lib/utils';
import { Search, Plus, Camera, Loader2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: '', fullName: '', email: '', phone: '', position: '', departmentId: '', shiftId: '', role: 'EMPLOYEE', hireDate: '', password: 'Employee@123' });

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, deptFilter, page],
    queryFn: () => employeeApi.list({ search, departmentId: deptFilter, page, limit: 12 }).then((r) => r.data),
  });
  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: () => departmentApi.list().then((r) => r.data) });
  const { data: shifts } = useQuery({ queryKey: ['shifts'], queryFn: () => shiftApi.list().then((r) => r.data) });

  const createMut = useMutation({
    mutationFn: (d: any) => employeeApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setShowAdd(false); toast.success('Thêm nhân viên thành công!'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Lỗi'),
  });

  const employees = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Nhân Viên</h1>
        <button onClick={() => setShowAdd(true)} id="add-employee-btn" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm Nhân Viên
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10" placeholder="Tìm theo tên, mã nhân viên..." />
        </div>
        <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }} className="input-field w-auto min-w-[160px]">
          <option value="">Tất cả phòng ban</option>
          {depts?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Employee Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-52 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-border mx-auto mb-3" />
              <div className="h-4 bg-border rounded w-3/4 mx-auto mb-2" />
              <div className="h-3 bg-border rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {employees.map((emp: any) => (
            <div key={emp.id} className="glass-card-hover p-5 text-center group">
              <div className="relative inline-block mb-3">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto"
                  style={{ background: `linear-gradient(135deg, hsl(${emp.code.charCodeAt(2) * 10 % 360},70%,45%), hsl(${emp.code.charCodeAt(2) * 10 % 360 + 60},70%,50%))` }}>
                  {getInitials(emp.fullName)}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-card flex items-center justify-center ${emp.isFaceRegistered ? 'bg-green-500' : 'bg-red-500'}`}>
                  {emp.isFaceRegistered
                    ? <CheckCircle className="w-3 h-3 text-white" />
                    : <XCircle className="w-3 h-3 text-white" />}
                </div>
              </div>
              <h3 className="font-semibold text-sm text-foreground truncate px-1">{emp.fullName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{emp.code}</p>
              <p className="text-xs text-muted-foreground truncate">{emp.department?.name}</p>
              <p className="text-xs mt-2">
                {emp.isFaceRegistered
                  ? <span className="badge-success">✓ Đã đăng ký face</span>
                  : <span className="badge-danger">✗ Chưa đăng ký</span>}
              </p>
              <div className="mt-3 flex gap-1.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/dashboard/employees/${emp.id}/register-face`}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-colors border border-purple-500/20">
                  <Camera className="w-3 h-3" /> Face ID
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground">{page} / {data.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary p-2 disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <h2 className="text-lg font-bold text-foreground mb-5">Thêm Nhân Viên Mới</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Mã NV *</label>
                  <input className="input-field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="NV001" required />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Họ tên *</label>
                  <input className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Nguyễn Văn A" required />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Email *</label>
                <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@company.com" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Chức vụ *</label>
                  <input className="input-field" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Developer" required />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Điện thoại</label>
                  <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0901234567" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Phòng ban *</label>
                  <select className="input-field" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} required>
                    <option value="">Chọn phòng ban</option>
                    {depts?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Ca làm việc</label>
                  <select className="input-field" value={form.shiftId} onChange={(e) => setForm({ ...form, shiftId: e.target.value })}>
                    <option value="">Không có</option>
                    {shifts?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Ngày vào làm *</label>
                  <input type="date" className="input-field" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Quyền</label>
                  <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="EMPLOYEE">Nhân viên</option>
                    <option value="DEPARTMENT_HEAD">Trưởng phòng</option>
                    <option value="HR_MANAGER">Quản lý HR</option>
                    <option value="SUPER_ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Hủy</button>
                <button type="submit" disabled={createMut.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {createMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : 'Tạo Nhân Viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
