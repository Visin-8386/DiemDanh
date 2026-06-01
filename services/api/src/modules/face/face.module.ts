import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FaceController } from './face.controller';
import { FaceService } from './face.service';

@Module({
  imports: [HttpModule],
  controllers: [FaceController],
  providers: [FaceService],
  exports: [FaceService],
})
export class FaceModule {}
