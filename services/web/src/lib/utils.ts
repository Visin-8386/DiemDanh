import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy'): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  if (fmt === 'HH:mm') return `${hours}:${minutes}`;
  if (fmt === 'dd/MM/yyyy HH:mm') return `${day}/${month}/${year} ${hours}:${minutes}`;
  if (fmt === 'YYYY-MM') return `${year}-${month}`;
  return `${day}/${month}/${year}`;
}

export function formatMinutes(mins: number): string {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}p`;
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'Quản trị viên', HR_MANAGER: 'Quản lý HR',
    DEPARTMENT_HEAD: 'Trưởng phòng', EMPLOYEE: 'Nhân viên',
  };
  return map[role] || role;
}

export function getStatusConfig(status: string): { label: string; className: string } {
  const map: Record<string, { label: string; className: string }> = {
    PRESENT:     { label: 'Đúng giờ',   className: 'badge-success' },
    LATE:        { label: 'Đi muộn',    className: 'badge-warning' },
    EARLY_LEAVE: { label: 'Về sớm',     className: 'badge-warning' },
    LATE_AND_EARLY: { label: 'Muộn & Sớm', className: 'badge-warning' },
    ABSENT:      { label: 'Vắng mặt',   className: 'badge-danger' },
    LEAVE:       { label: 'Nghỉ phép',  className: 'badge-info' },
    HOLIDAY:     { label: 'Ngày lễ',    className: 'badge-gray' },
    PENDING:     { label: 'Chờ duyệt',  className: 'badge-warning' },
    APPROVED:    { label: 'Đã duyệt',   className: 'badge-success' },
    REJECTED:    { label: 'Từ chối',    className: 'badge-danger' },
  };
  return map[status] || { label: status, className: 'badge-gray' };
}

export function getLeaveTypeLabel(type: string): string {
  const map: Record<string, string> = {
    ANNUAL: 'Nghỉ phép năm', SICK: 'Nghỉ ốm',
    UNPAID: 'Nghỉ không lương', BUSINESS: 'Công tác',
    MATERNITY: 'Thai sản', OTHER: 'Khác',
  };
  return map[type] || type;
}

export function getInitials(name: string): string {
  return name?.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase() || '?';
}
