import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { FaceModule } from '../face/face.module';

@Module({
  imports: [HttpModule, FaceModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
