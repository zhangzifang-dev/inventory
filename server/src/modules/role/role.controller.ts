import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Role } from '../../entities/role.entity';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @RequirePermissions('role:create')
  async create(@Body() dto: CreateRoleDto): Promise<Role> {
    return this.roleService.create(dto);
  }

  @Get()
  @RequirePermissions('role:view')
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('name') name?: string,
  ) {
    return this.roleService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      name,
    );
  }

  @Get(':id')
  @RequirePermissions('role:view')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Role> {
    return this.roleService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('role:update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ): Promise<Role> {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('role:delete')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.roleService.remove(id);
  }

  @Put(':id/permissions')
  @RequirePermissions('role:update')
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body('permissionIds') permissionIds: number[],
  ): Promise<Role> {
    return this.roleService.assignPermissions(id, permissionIds);
  }
}
