import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Leave Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave')
export class LeaveController {
  constructor(private svc: LeaveService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đơn nghỉ phép' })
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.svc.create(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Đơn nghỉ của tôi' })
  findMy(@CurrentUser() user: any) {
    return this.svc.findMy(user.id);
  }

  @Get()
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DEPARTMENT_HEAD')
  @ApiOperation({ summary: 'Tất cả đơn nghỉ (HR+)' })
  findAll(@Query() query: any) {
    return this.svc.findAll(query);
  }

  @Patch(':id/approve')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Phê duyệt đơn' })
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.approve(id, user.id);
  }

  @Patch(':id/reject')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Từ chối đơn' })
  reject(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any) {
    return this.svc.reject(id, user.id, dto.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hủy đơn (chỉ đơn đang chờ)' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.cancel(id, user.id);
  }
}
