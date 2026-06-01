import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.shift.findMany({ orderBy: { name: 'asc' } }); }

  create(dto: any) { return this.prisma.shift.create({ data: dto }); }

  update(id: string, dto: any) { return this.prisma.shift.update({ where: { id }, data: dto }); }

  async remove(id: string) {
    await this.prisma.shift.delete({ where: { id } });
    return { message: 'Đã xóa ca làm việc' };
  }
}
