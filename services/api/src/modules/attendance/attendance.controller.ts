import {
  Controller, Post, Get, Patch, Param, Query, UseGuards,
  UseInterceptors, UploadedFile
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Body } from '@nestjs/common';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('checkin')
  @ApiOperation({ summary: 'Điểm danh vào — nhận diện khuôn mặt' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  checkIn(@UploadedFile() file: Express.Multer.File) {
    return this.attendanceService.checkIn(file);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Điểm danh ra — nhận diện khuôn mặt' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  checkOut(@UploadedFile() file: Express.Multer.File) {
    return this.attendanceService.checkOut(file);
  }

  @Get('today')
  @ApiOperation({ summary: 'Danh sách điểm danh hôm nay' })
  getToday() {
    return this.attendanceService.getToday();
  }

  @Get('my')
  @ApiOperation({ summary: 'Lịch sử điểm danh của tôi' })
  getMyAttendance(@CurrentUser() user: any, @Query() query: any) {
    return this.attendanceService.getMyAttendance(user.id, query);
  }

  @Get()
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DEPARTMENT_HEAD')
  @ApiOperation({ summary: 'Tất cả chấm công (HR+)' })
  getAll(@Query() query: any) {
    return this.attendanceService.getAll(query);
  }

  @Patch(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Chỉnh sửa thủ công (HR)' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.attendanceService.updateAttendance(id, dto);
  }
}
