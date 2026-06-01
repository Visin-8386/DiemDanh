import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private svc: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách phòng ban' })
  findAll() { return this.svc.findAll(); }

  @Post()
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Patch(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
