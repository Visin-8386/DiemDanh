import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Response } from 'express';
import * as dayjs from 'dayjs';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private svc: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Thống kê dashboard' })
  dashboard() { return this.svc.getDashboardStats(); }

  @Get('monthly')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DEPARTMENT_HEAD')
  @ApiOperation({ summary: 'Tổng hợp tháng' })
  monthly(@Query('month') month: string, @Query('departmentId') deptId?: string) {
    const m = month || dayjs().format('YYYY-MM');
    return this.svc.getMonthlySummary(m, deptId);
  }

  @Get('export/excel')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Xuất Excel' })
  async exportExcel(
    @Query('month') month: string,
    @Query('departmentId') deptId: string,
    @Res() res: Response,
  ) {
    const m = month || dayjs().format('YYYY-MM');
    const buffer = await this.svc.exportExcel(m, deptId);
    const filename = `BaoCaoChAmCong_${dayjs(m).format('MM-YYYY')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
