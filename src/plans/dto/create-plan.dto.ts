import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    IsNumberString,
} from 'class-validator';

export class CreatePlanDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumberString()
    @IsNotEmpty()
    price: string;

    @IsNumberString()
    @IsOptional()
    yearlyPrice: string | null;

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