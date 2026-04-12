import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum ReportType {
  DAILY = 'daily',
  MONTHLY = 'monthly',
}

export class ReportQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;
}
