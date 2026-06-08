import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as dayjs from 'dayjs';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const today = dayjs().startOf('day').toDate();
    const monthStart = dayjs().startOf('month').toDate();
    const monthEnd = dayjs().endOf('month').toDate();

    const [
      totalEmployees,
      todayAttendance,
      monthAttendance,
      pendingLeave,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.attendance.findMany({
        where: { date: today },
        include: { employee: { include: { department: true } } },
      }),
      this.prisma.attendance.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } },
      }),
      this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    ]);

    // Filter to only active employees for accurate dashboard stats
    const activeTodayAttendance = todayAttendance.filter((a) => a.employee?.status === 'ACTIVE');

    const presentToday = activeTodayAttendance.filter((a) => ['PRESENT', 'LATE'].includes(a.status)).length;
    const lateToday = activeTodayAttendance.filter((a) => a.status === 'LATE').length;
    const leaveToday = activeTodayAttendance.filter((a) => a.status === 'LEAVE').length;
    const absentToday = Math.max(0, totalEmployees - presentToday - leaveToday);
    const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

    // Last 7 days chart data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      const dayStart = date.startOf('day').toDate();
      const dayRecords = await this.prisma.attendance.findMany({
        where: { date: dayStart },
        include: { employee: true },
      });
      const activeDayRecords = dayRecords.filter((a) => a.employee?.status === 'ACTIVE');
      const present = activeDayRecords.filter((a) => ['PRESENT', 'LATE'].includes(a.status)).length;
      last7Days.push({
        date: date.format('DD/MM'),
        present,
        total: totalEmployees,
        rate: totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0,
      });
    }

    return {
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
      attendanceRate,
      pendingLeave,
      recentCheckins: activeTodayAttendance.slice(0, 10),
      last7Days,
      todayDistribution: {
        present: Math.max(0, presentToday - lateToday),
        late: lateToday,
        absent: absentToday,
        leave: leaveToday,
      },
    };
  }

  async getMonthlySummary(month: string, departmentId?: string) {
    const start = dayjs(month).startOf('month').toDate();
    const end = dayjs(month).endOf('month').toDate();

    const where: any = { status: 'ACTIVE' };
    if (departmentId) where.departmentId = departmentId;

    const employees = await this.prisma.employee.findMany({
      where,
      include: {
        department: true,
        shift: true,
        attendances: { where: { date: { gte: start, lte: end } } },
      },
    });

    return employees.map((emp) => {
      const records = emp.attendances;
      const present = records.filter((r) => r.status === 'PRESENT').length;
      const late = records.filter((r) => ['LATE', 'LATE_AND_EARLY'].includes(r.status)).length;
      const absent = records.filter((r) => r.status === 'ABSENT').length;
      const leave = records.filter((r) => r.status === 'LEAVE').length;
      const totalWorkMinutes = records.reduce((sum, r) => sum + (r.workMinutes || 0), 0);
      const overtimeMinutes = records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);

      // Calculate work days specific to the employee's shift
      let empWorkDays = 0;
      let current = dayjs(start);
      const empWorkDaysArr = emp.shift?.workDays || [1, 2, 3, 4, 5]; // Default to Mon-Fri
      while (current.isBefore(end) || current.isSame(end, 'day')) {
        if (empWorkDaysArr.includes(current.day())) empWorkDays++;
        current = current.add(1, 'day');
      }

      return {
        employeeId: emp.id,
        code: emp.code,
        fullName: emp.fullName,
        department: emp.department?.name,
        position: emp.position,
        workDays: empWorkDays,
        present,
        late,
        absent,
        leave,
        totalWorkHours: +(totalWorkMinutes / 60).toFixed(1),
        overtimeHours: +(overtimeMinutes / 60).toFixed(1),
        attendanceRate: empWorkDays > 0 ? Math.min(100, Math.round(((present + late) / empWorkDays) * 100)) : 0,
      };
    });
  }

  // Removed generic getWorkDays as it's now calculated per employee

  async exportExcel(month: string, departmentId?: string): Promise<Buffer> {
    const summary = await this.getMonthlySummary(month, departmentId);
    const monthLabel = dayjs(month).format('MM/YYYY');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Báo cáo ${monthLabel}`);

    // Title row
    sheet.mergeCells('A1:L1');
    sheet.getCell('A1').value = `BÁO CÁO CHẤM CÔNG THÁNG ${monthLabel}`;
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 36;

    // Header
    const headers = ['STT', 'Mã NV', 'Họ và Tên', 'Phòng Ban', 'Chức Vụ',
      'Ngày Công', 'Đúng Giờ', 'Đi Muộn', 'Vắng', 'Nghỉ Phép',
      'Tổng Giờ', 'OT (Giờ)'];
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6D28D9' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      };
    });
    sheet.getRow(2).height = 24;

    // Column widths
    const colWidths = [5, 8, 22, 18, 18, 10, 10, 10, 8, 10, 10, 10];
    colWidths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

    // Data rows
    summary.forEach((emp, idx) => {
      const row = sheet.addRow([
        idx + 1, emp.code, emp.fullName, emp.department, emp.position,
        emp.workDays, emp.present, emp.late, emp.absent, emp.leave,
        emp.totalWorkHours, emp.overtimeHours,
      ]);

      // Color absent cells red
      if (emp.absent > 0) {
        row.getCell(9).font = { color: { argb: 'FFEF4444' }, bold: true };
      }
      // Color late cells yellow
      if (emp.late > 0) {
        row.getCell(8).font = { color: { argb: 'FFCA8A04' }, bold: true };
      }

      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
      // Alternate row color
      if (idx % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F7FF' } };
        });
      }
    });

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
}
