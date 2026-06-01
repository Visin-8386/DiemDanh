'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getStatusConfig, getLeaveTypeLabel, formatDate } from '@/lib/utils';
import { Plus, Check, X, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeavePage() {
  const { user, isHR } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'my' | 'all'>('my');
  const [showCreate, setShowCreate] = useState(false);
  const [rejectId, setRejectId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' });

  const myQuery = useQuery({ queryKey: ['leave-my'], queryFn: () => leaveApi.my().then(r => r.data) });
  const allQuery = useQuery({ queryKey: ['leave-all'], queryFn: () => leaveApi.all().then(r => r.data), enabled: isHR() });

  const createMut = useMutation({
    mutationFn: () => leaveApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leave-my'] }); setShowCreate(false); toast.success('Đã gửi đơn nghỉ phép!'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Lỗi tạo đơn'),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => leaveApi.approve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leave-all'] }); toast.success('Đã phê duyệt đơn'); },
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: any) => leaveApi.reject(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leave-all'] }); setRejectId(''); toast.success('Đã từ chối đơn'); },
  });

  const totalDays = form.startDate && form.endDate
    ? Math.max(0, Math.floor((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000) + 1)
    : 0;

  const records = tab === 'my' ? (myQuery.data || []) : (allQuery.data || []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Đơn Nghỉ Phép</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tạo Đơn Nghỉ
        </button>
      </div>

      {/* Tabs */}
      {isHR() && (
        <div className="flex gap-1 p-1 rounded-xl bg-accent border border-border w-fit">
          {[{ key: 'my', label: 'Đơn Của Tôi' }, { key: 'all', label: 'Quản Lý Đơn' }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${tab === t.key
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow'
                : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Leave Request Cards */}
      <div className="space-y-3">
        {records.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Chưa có đơn nghỉ phép nào</p>
          </div>
        ) : records.map((req: any) => {
          const cfg = getStatusConfig(req.status);
          return (
            <div key={req.id} className="glass-card p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    {tab === 'all' && (
                      <p className="font-semibold text-foreground">{req.employee?.fullName}
                        <span className="text-muted-foreground font-normal text-sm ml-2">· {req.employee?.department?.name}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="badge-purple">{getLeaveTypeLabel(req.type)}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(req.startDate)} → {formatDate(req.endDate)}
                        <span className="ml-1.5 font-semibold text-foreground">({req.totalDays} ngày)</span>
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">{req.reason}</p>
                    {req.rejectReason && (
                      <p className="text-sm text-red-400 mt-1">Lý do từ chối: {req.rejectReason}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cfg.className}>{cfg.label}</span>
                  {tab === 'all' && req.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button onClick={() => approveMut.mutate(req.id)} disabled={approveMut.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20 text-sm transition-colors">
                        <Check className="w-3.5 h-3.5" /> Duyệt
                      </button>
                      <button onClick={() => setRejectId(req.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 text-sm transition-colors">
                        <X className="w-3.5 h-3.5" /> Từ Chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md animate-slide-up">
            <h2 className="text-lg font-bold text-foreground mb-5">Tạo Đơn Nghỉ Phép</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Loại nghỉ</label>
                <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="ANNUAL">Nghỉ phép năm</option>
                  <option value="SICK">Nghỉ ốm</option>
                  <option value="UNPAID">Nghỉ không lương</option>
                  <option value="BUSINESS">Công tác</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Từ ngày</label>
                  <input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Đến ngày</label>
                  <input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              {totalDays > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Tổng số ngày nghỉ:</span>
                  <span className="font-bold text-purple-400">{totalDays} ngày</span>
                  {user?.annualLeaveLeft !== undefined && form.type === 'ANNUAL' && (
                    <span className="text-muted-foreground">(Còn lại: {user.annualLeaveLeft} ngày phép)</span>
                  )}
                </div>
              )}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Lý do *</label>
                <textarea className="input-field resize-none" rows={3} value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Nhập lý do nghỉ phép..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Hủy</button>
                <button onClick={() => createMut.mutate()} disabled={createMut.isPending || !form.startDate || !form.endDate || !form.reason}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {createMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</> : 'Gửi Đơn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-sm animate-slide-up border border-red-500/20">
            <h2 className="text-lg font-bold text-foreground mb-4">Từ Chối Đơn Nghỉ</h2>
            <textarea className="input-field resize-none mb-4" rows={3} value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối..." />
            <div className="flex gap-3">
              <button onClick={() => { setRejectId(''); setRejectReason(''); }} className="btn-secondary flex-1">Hủy</button>
              <button onClick={() => rejectMut.mutate({ id: rejectId, reason: rejectReason })}
                disabled={!rejectReason || rejectMut.isPending}
                className="flex-1 py-2.5 px-5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors disabled:opacity-50">
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
