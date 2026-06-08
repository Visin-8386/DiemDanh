import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FaceService } from '../face/face.service';
import { Cron } from '@nestjs/schedule';
import * as dayjs from 'dayjs';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private faceService: FaceService,
  ) {}

  async checkIn(file: Express.Multer.File) {
    // 1. Recognize face
    let faceResult: any;
    try {
      faceResult = await this.faceService.recognizeFace(file);
    } catch (err) {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Lỗi kết nối AI service. Vui lòng thử lại.';
      throw new BadRequestException(msg);
    }

    if (!faceResult.recognized) {
      throw new BadRequestException(
        faceResult.message || 'Không nhận diện được khuôn mặt. Vui lòng thử lại với ánh sáng tốt hơn.',
      );
    }

    // 2. Get employee + shift
    const employee = await this.prisma.employee.findUnique({
      where: { id: faceResult.employee_id },
      include: { shift: true },
    });
    if (!employee || employee.status === 'INACTIVE') {
      throw new BadRequestException('Nhân viên không hoạt động');
    }

    // 3. Check if already checked in today
    const today = dayjs().startOf('day').toDate();
    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
    });
    if (existing?.checkInTime) {
      throw new ConflictException(`Bạn đã điểm danh vào lúc ${dayjs(existing.checkInTime).format('HH:mm')} rồi`);
    }

    // 4. Calculate status (LATE / PRESENT)
    const now = dayjs();
    let status: any = 'PRESENT';
    let lateMinutes = 0;

    if (employee.shift) {
      const [sh, sm] = employee.shift.startTime.split(':').map(Number);
      const shiftStart = dayjs().hour(sh).minute(sm).second(0);
      const threshold = shiftStart.add(employee.shift.lateThresholdMins, 'minute');
      if (now.isAfter(threshold)) {
        status = 'LATE';
        lateMinutes = now.diff(shiftStart, 'minute');
      }
    }

    // 5. Upsert attendance record
    const attendance = await this.prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
      create: {
        employeeId: employee.id,
        date: today,
        checkInTime: now.toDate(),
        checkInConfidence: faceResult.confidence,
        status,
        lateMinutes,
      },
      update: {
        checkInTime: now.toDate(),
        checkInConfidence: faceResult.confidence,
        status,
        lateMinutes,
      },
    });

    const { passwordHash, ...safeEmp } = employee;
    return {
      success: true,
      message: `Chào ${employee.fullName}! Điểm danh thành công lúc ${now.format('HH:mm')}`,
      employee: safeEmp,
      attendance,
      confidence: faceResult.confidence,
    };
  }

  async checkOut(file: Express.Multer.File) {
    let faceResult: any;
    try {
      faceResult = await this.faceService.recognizeFace(file);
    } catch (err) {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Lỗi kết nối AI service. Vui lòng thử lại.';
      throw new BadRequestException(msg);
    }
    if (!faceResult.recognized) {
      throw new BadRequestException('Không nhận diện được khuôn mặt.');
    }

    const today = dayjs().startOf('day').toDate();
    const record = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: faceResult.employee_id, date: today } },
      include: { employee: { include: { shift: true } } },
    });

    if (!record) throw new BadRequestException('Bạn chưa điểm danh vào hôm nay');
    if (record.checkOutTime) {
      throw new ConflictException(`Bạn đã điểm danh ra lúc ${dayjs(record.checkOutTime).format('HH:mm')} rồi`);
    }

    const now = dayjs();
    const workMinutes = record.checkInTime ? now.diff(dayjs(record.checkInTime), 'minute') : 0;

    let status = record.status;
    let earlyLeaveMinutes = 0;
    let overtimeMinutes = 0;
    const shift = record.employee.shift;

    if (shift) {
      const [eh, em] = shift.endTime.split(':').map(Number);
      const shiftEnd = dayjs().hour(eh).minute(em).second(0);
      const earlyThreshold = shiftEnd.subtract(shift.earlyLeaveMins, 'minute');

      if (now.isBefore(earlyThreshold)) {
        earlyLeaveMinutes = shiftEnd.diff(now, 'minute');
        status = status === 'LATE' ? 'LATE_AND_EARLY' : 'EARLY_LEAVE';
      } else if (now.isAfter(shiftEnd)) {
        overtimeMinutes = now.diff(shiftEnd, 'minute');
      }
    }

    const updated = await this.prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOutTime: now.toDate(),
        checkOutConfidence: faceResult.confidence,
        workMinutes,
        overtimeMinutes,
        earlyLeaveMinutes,
        status,
      },
    });

    const { passwordHash, ...safeEmp } = record.employee;
    return {
      success: true,
      message: `Tạm biệt ${record.employee.fullName}! Điểm danh ra lúc ${now.format('HH:mm')} — ${Math.floor(workMinutes / 60)}h${workMinutes % 60}p`,
      employee: safeEmp,
      attendance: updated,
    };
  }

  async getToday() {
    const today = dayjs().startOf('day').toDate();
    return this.prisma.attendance.findMany({
      where: { date: today },
      include: { employee: { include: { department: true } } },
      orderBy: { checkInTime: 'asc' },
    });
  }

  async getMyAttendance(employeeId: string, query: any = {}) {
    const { page = 1, limit = 20, month } = query;
    const skip = (page - 1) * limit;
    const where: any = { employeeId };

    if (month) {
      const start = dayjs(month).startOf('month').toDate();
      const end = dayjs(month).endOf('month').toDate();
      where.date = { gte: start, lte: end };
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({ where, skip, take: +limit, orderBy: { date: 'desc' } }),
      this.prisma.attendance.count({ where }),
    ]);

    return { data, total, page: +page, limit: +limit };
  }

  async getAll(query: any = {}) {
    const { page = 1, limit = 50, departmentId, month, status, employeeId } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (departmentId) where.employee = { departmentId };
    if (month) {
      where.date = {
        gte: dayjs(month).startOf('month').toDate(),
        lte: dayjs(month).endOf('month').toDate(),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: +limit,
        include: { employee: { include: { department: true } } },
        orderBy: [{ date: 'desc' }, { checkInTime: 'asc' }],
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { data, total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) };
  }

  async updateAttendance(id: string, dto: any) {
    return this.prisma.attendance.update({
      where: { id },
      data: { ...dto, isManualEdit: true },
    });
  }

  // Run at 23:00 every day — mark absent for employees who didn't check in
  @Cron('0 23 * * 1-5')
  async autoMarkAbsent() {
    const today = dayjs().startOf('day').toDate();
    const dayOfWeek = dayjs().day(); // 0=Sun, 1=Mon...

    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { shift: true },
    });

    for (const emp of employees) {
      if (emp.shift && !emp.shift.workDays.includes(dayOfWeek)) continue;

      const existing = await this.prisma.attendance.findUnique({
        where: { employeeId_date: { employeeId: emp.id, date: today } },
      });

      if (!existing) {
        await this.prisma.attendance.create({
          data: {
            employeeId: emp.id,
            date: today,
            status: 'ABSENT',
            isManualEdit: false,
          },
        });
      }
    }
    console.log('✅ Auto-marked absent for today');
  }
}
