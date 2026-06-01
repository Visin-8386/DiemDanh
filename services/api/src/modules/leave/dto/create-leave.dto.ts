import {
  IsEnum, IsDateString, IsString, IsNotEmpty, IsOptional, IsNumber, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';

export class CreateLeaveDto {
  @ApiProperty({ enum: LeaveType })
  @IsEnum(LeaveType)
  type: LeaveType;

  @ApiProperty({ example: '2024-02-10', description: 'Start date YYYY-MM-DD' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-02-12', description: 'End date YYYY-MM-DD' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Đi khám bệnh định kỳ' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
