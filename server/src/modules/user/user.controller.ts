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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ResponseDto } from '../../common/dto/response.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<ResponseDto<any>> {
    const user = await this.userService.create(dto);
    return ResponseDto.success(user, '用户创建成功');
  }

  @Get()
  async findAll(@Query() query: QueryUserDto): Promise<ResponseDto<any>> {
    const result = await this.userService.findAll(query);
    return ResponseDto.success(result);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<any>> {
    const user = await this.userService.findOne(id);
    return ResponseDto.success(user);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<ResponseDto<any>> {
    const user = await this.userService.update(id, dto);
    return ResponseDto.success(user, '用户更新成功');
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<null>> {
    await this.userService.remove(id);
    return ResponseDto.success(null, '用户删除成功');
  }

  @Put(':id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('password') password: string,
  ): Promise<ResponseDto<null>> {
    await this.userService.resetPassword(id, password);
    return ResponseDto.success(null, '密码重置成功');
  }
}
