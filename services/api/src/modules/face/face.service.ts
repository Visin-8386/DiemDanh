import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';

@Injectable()
export class FaceService {
  private readonly aiUrl: string;

  constructor(
    private prisma: PrismaService,
    private http: HttpService,
  ) {
    this.aiUrl = process.env.AI_SERVICE_URL || 'http://ai-service:5000';
  }

  async registerFace(employeeId: string, files: Express.Multer.File[]) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Nhân viên không tồn tại');
    if (!files || files.length === 0) throw new BadRequestException('Vui lòng cung cấp ít nhất 1 ảnh');

    const form = new FormData();
    form.append('employee_id', employeeId);
    form.append('employee_code', employee.code);
    for (const file of files) {
      form.append('files', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    }

    try {
      const response = await firstValueFrom(
        this.http.post(`${this.aiUrl}/face/register`, form, {
          headers: form.getHeaders(),
          timeout: 30000,
        }),
      );

      await this.prisma.employee.update({
        where: { id: employeeId },
        data: { isFaceRegistered: true },
      });

      return response.data;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi đăng ký khuôn mặt';
      throw new BadRequestException(msg);
    }
  }

  async recognizeFace(file: Express.Multer.File) {
    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });

    const response = await firstValueFrom(
      this.http.post(`${this.aiUrl}/face/recognize`, form, {
        headers: form.getHeaders(),
        timeout: 15000,
      }),
    );
    return response.data;
  }

  async deleteFace(employeeId: string) {
    await firstValueFrom(
      this.http.delete(`${this.aiUrl}/face/register/${employeeId}`)
    ).catch(() => {});

    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { isFaceRegistered: false },
    });
    return { message: 'Đã xóa dữ liệu khuôn mặt' };
  }

  async getStatus(employeeId: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new NotFoundException('Nhân viên không tồn tại');
    return { employeeId, isFaceRegistered: emp.isFaceRegistered };
  }
}
