import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('报表中心')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('sales')
  @ApiOperation({ summary: '销售报表' })
  async getSalesReport(@Query() query: ReportQueryDto) {
    return this.reportService.getSalesReport(query);
  }

  @Get('purchase')
  @ApiOperation({ summary: '采购报表' })
  async getPurchaseReport(@Query() query: ReportQueryDto) {
    return this.reportService.getPurchaseReport(query);
  }

  @Get('profit')
  @ApiOperation({ summary: '利润报表' })
  async getProfitReport(@Query() query: ReportQueryDto) {
    return this.reportService.getProfitReport(query);
  }
}
