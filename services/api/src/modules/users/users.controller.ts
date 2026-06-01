import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách nhân viên' })
  findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  @Get('stats')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Thống kê nhân viên' })
  getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết nhân viên' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Thêm nhân viên mới' })
  create(@Body() dto: any) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Cập nhật nhân viên' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Vô hiệu hóa nhân viên' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
