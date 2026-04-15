import { Controller, Get, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { RoleService } from './role.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('角色管理')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({ summary: '获取角色列表' })
  async findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findOne(id);
  }
}
