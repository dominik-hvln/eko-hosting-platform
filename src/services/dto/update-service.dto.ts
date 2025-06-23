import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ServiceStatus } from '../../common/enums/service-status.enum';

export class UpdateServiceDto {
    @IsEnum(ServiceStatus)
    @IsOptional()
    status?: ServiceStatus;

    @IsBoolean()
    @IsOptional()
    autoRenew?: boolean;
}