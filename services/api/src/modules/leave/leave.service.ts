import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as dayjs from 'dayjs';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async create(employeeId: string, dto: any) {
    const startDate = dayjs(dto.startDate).startOf('day').toDate();
    const endDate = dayjs(dto.endDate).startOf('day').toDate();
    const totalDays = dayjs(endDate).diff(dayjs(startDate), 'day') + 1;

    if (totalDays <= 0) throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');

    // Check leave balance
    if (dto.type === 'ANNUAL') {
      const emp = await this.prisma.employee.findUnique({ where: { id: employeeId } });
      if (emp.annualLeaveLeft < totalDays) {
        throw new BadRequestException(`Không đủ ngày phép. Còn lại: ${emp.annualLeaveLeft} ngày`);
      }
    }

    return this.prisma.leaveRequest.create({
      data: {
        employeeId,
        type: dto.type,
        startDate,
        endDate,
        totalDays,
        reason: dto.reason,
      },
      include: { employee: { select: { fullName: true, code: true } } },
    });
  }

  async findMy(employeeId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      include: { approvedBy: { select: { fullName: true } } },
    });
  }

  async findAll(query: any = {}) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.employeeId) where.employeeId = query.employeeId;
    return this.prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { include: { department: true } },
        approvedBy: { select: { fullName: true } },
      },
    });
  }

  async approve(id: string, approverId: string) {
    const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Không tìm thấy đơn');
    if (req.status !== 'PENDING') throw new BadRequestException('Đơn đã được xử lý rồi');

    // Deduct annual leave balance
    if (req.type === 'ANNUAL') {
      await this.prisma.employee.update({
        where: { id: req.employeeId },
        data: { annualLeaveLeft: { decrement: req.totalDays } },
      });
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: approverId, approvedAt: new Date() },
    });
  }

  async reject(id: string, approverId: string, reason: string) {
    const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Không tìm thấy đơn');
    if (req.status !== 'PENDING') throw new BadRequestException('Đơn đã được xử lý rồi');

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'REJECTED', approvedById: approverId, approvedAt: new Date(), rejectReason: reason },
    });
  }

  async cancel(id: string, employeeId: string) {
    const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!req || req.employeeId !== employeeId) throw new NotFoundException('Không tìm thấy đơn');
    if (req.status !== 'PENDING') throw new BadRequestException('Chỉ có thể hủy đơn đang chờ duyệt');

    await this.prisma.leaveRequest.delete({ where: { id } });
    return { message: 'Đã hủy đơn' };
  }
}
