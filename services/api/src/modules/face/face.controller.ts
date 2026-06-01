import {
  Controller, Post, Delete, Get, Param, UseGuards,
  UseInterceptors, UploadedFiles, UploadedFile
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { FaceService } from './face.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Face Recognition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('face')
export class FaceController {
  constructor(private faceService: FaceService) {}

  @Post('register/:employeeId')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Đăng ký khuôn mặt nhân viên (1-5 ảnh)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 5, { limits: { fileSize: 5 * 1024 * 1024 } }))
  registerFace(
    @Param('employeeId') employeeId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.faceService.registerFace(employeeId, files);
  }

  @Delete(':employeeId')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Xóa dữ liệu khuôn mặt' })
  deleteFace(@Param('employeeId') employeeId: string) {
    return this.faceService.deleteFace(employeeId);
  }

  @Get('status/:employeeId')
  @ApiOperation({ summary: 'Kiểm tra trạng thái đăng ký khuôn mặt' })
  getStatus(@Param('employeeId') employeeId: string) {
    return this.faceService.getStatus(employeeId);
  }
}
