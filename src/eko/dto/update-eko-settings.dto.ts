import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class UpdateEkoSettingsDto {
    @IsInt() @IsPositive() @IsOptional()
    pointsPerPln?: number;

    @IsInt() @IsPositive() @IsOptional()
    pointsToPlantTree?: number;

    @IsInt() @IsPositive() @IsOptional()
    pointsForDarkMode?: number;

    @IsInt() @IsPositive() @IsOptional()
    pointsFor2FA?: number;

    @IsInt() @IsPositive() @IsOptional()
    pointsForAutoRenew?: number;

    @IsInt() @IsPositive() @IsOptional()
    pointsForYearlyPayment?: number;
}