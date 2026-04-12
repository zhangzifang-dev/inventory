import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportService, SalesReport, PurchaseReport, ProfitReport } from './report.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('sales')
  async getSalesReport(@Query() query: ReportQueryDto): Promise<SalesReport> {
    return this.reportService.getSalesReport(query);
  }

  @Get('purchase')
  async getPurchaseReport(@Query() query: ReportQueryDto): Promise<PurchaseReport> {
    return this.reportService.getPurchaseReport(query);
  }

  @Get('profit')
  async getProfitReport(@Query() query: ReportQueryDto): Promise<ProfitReport> {
    return this.reportService.getProfitReport(query);
  }
}
