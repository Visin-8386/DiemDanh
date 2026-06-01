import {
  IsString, IsNotEmpty, IsInt, IsArray, IsBoolean,
  IsOptional, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShiftDto {
  @ApiProperty({ example: 'Ca Hành Chính' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'CA-HC' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: '08:00', description: 'Format HH:mm' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:30', description: 'Format HH:mm' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ example: 15, description: 'Minutes after startTime before considered late' })
  @IsOptional()
  @IsInt()
  @Min(0)
  lateThresholdMins?: number;

  @ApiPropertyOptional({ example: 15, description: 'Minutes before endTime considered early leave' })
  @IsOptional()
  @IsInt()
  @Min(0)
  earlyLeaveMins?: number;

  @ApiProperty({ example: [1, 2, 3, 4, 5], description: 'Work days: 1=Mon, 7=Sun' })
  @IsArray()
  @IsInt({ each: true })
  workDays: number[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
