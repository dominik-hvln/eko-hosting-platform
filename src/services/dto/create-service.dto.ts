import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BillingCycle } from '../../common/enums/billing-cycle.enum';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  planId: string;

  @IsUUID()
  userId: string;

  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @IsDateString()
  @IsOptional()
  expiresAt?: Date;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}
