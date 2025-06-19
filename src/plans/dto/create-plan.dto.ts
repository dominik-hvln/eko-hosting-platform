import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
} from 'class-validator';

export class CreatePlanDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsPositive()
    price: number;

    @IsNumber()
    @IsPositive()
    cpuLimit: number;

    @IsNumber()
    @IsPositive()
    ramLimit: number;

    @IsNumber()
    @IsPositive()
    diskSpaceLimit: number;

    @IsNumber()
    @IsPositive()
    monthlyTransferLimit: number;

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}