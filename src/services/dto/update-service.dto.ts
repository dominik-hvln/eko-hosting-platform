import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ServiceStatus } from '../../common/enums/service-status.enum';

export class UpdateServiceDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEnum(ServiceStatus)
    @IsOptional()
    status?: ServiceStatus;
}