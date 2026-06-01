import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RejectLeaveDto {
  @ApiPropertyOptional({ example: 'Không đủ nhân sự trong thời gian này' })
  @IsOptional()
  @IsString()
  rejectReason?: string;
}
