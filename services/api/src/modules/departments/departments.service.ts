import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const depts = await this.prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
    return depts.map((d) => ({ ...d, employeeCount: d._count.employees }));
  }

  async create(dto: any) {
    return this.prisma.department.create({ data: dto });
  }

  async update(id: string, dto: any) {
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.department.delete({ where: { id } });
    return { message: 'Đã xóa phòng ban' };
  }
}
