import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any = {}) {
    const { search, departmentId, role, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (departmentId) where.departmentId = departmentId;
    if (role) where.role = role;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: +limit,
        include: { department: true, shift: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: data.map(({ passwordHash, ...e }) => e),
      total,
      page: +page,
      limit: +limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: { department: true, shift: true },
    });
    if (!emp) throw new NotFoundException('Nhân viên không tồn tại');
    const { passwordHash, ...safe } = emp;
    return safe;
  }

  async create(dto: any) {
    const existing = await this.prisma.employee.findFirst({
      where: { OR: [{ email: dto.email }, { code: dto.code }] },
    });
    if (existing) throw new ConflictException('Email hoặc mã nhân viên đã tồn tại');

    const passwordHash = await bcrypt.hash(dto.password || 'Employee@123', 10);
    const emp = await this.prisma.employee.create({
      data: {
        code: dto.code,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        position: dto.position,
        departmentId: dto.departmentId,
        shiftId: dto.shiftId,
        role: dto.role || 'EMPLOYEE',
        hireDate: new Date(dto.hireDate),
        passwordHash,
      },
      include: { department: true, shift: true },
    });
    const { passwordHash: _, ...safe } = emp;
    return safe;
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
      delete data.password;
    }
    delete data.email; // email cannot be changed
    const emp = await this.prisma.employee.update({
      where: { id },
      data,
      include: { department: true, shift: true },
    });
    const { passwordHash, ...safe } = emp;
    return safe;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.employee.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    return { message: 'Đã vô hiệu hóa nhân viên' };
  }

  async getStats() {
    const [total, active, faceRegistered] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { isFaceRegistered: true } }),
    ]);
    return { total, active, faceRegistered };
  }
}
