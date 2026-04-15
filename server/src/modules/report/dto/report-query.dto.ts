import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';

export enum ReportType {
  DAILY = 'daily',
  MONTHLY = 'monthly',
}

export enum GroupByType {
  DAY = 'day',
  MONTH = 'month',
}

export class ReportQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @IsOptional()
  @IsEnum(GroupByType)
  groupBy?: GroupByType;

  @IsOptional()
  @IsString()
  status?: string;
}
