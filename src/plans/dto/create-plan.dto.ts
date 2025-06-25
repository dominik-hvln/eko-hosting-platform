// src/plans/dto/create-plan.dto.ts

import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsNumberString,
    IsNumber,
    IsPositive,
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

    // --- POPRAWKA TYPÓW I WALIDATORÓW ---
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
    // ------------------------------------

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;

    @IsString()
    @IsOptional()
    stripeProductId?: string;

    @IsString()
    @IsOptional()
    stripeMonthlyPriceId?: string;

    @IsString()
    @IsOptional()
    stripeYearlyPriceId?: string;
}