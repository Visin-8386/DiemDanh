import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckInDto {
  @ApiPropertyOptional({ description: 'Optional note for check-in' })
  @IsOptional()
  @IsString()
  note?: string;
}
