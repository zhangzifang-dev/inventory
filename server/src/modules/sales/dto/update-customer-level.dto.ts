import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerLevelDto } from './create-customer-level.dto';

export class UpdateCustomerLevelDto extends PartialType(CreateCustomerLevelDto) {}
