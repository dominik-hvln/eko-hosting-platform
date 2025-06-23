import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class UpdateUserDto {
    @IsEmail()
    @IsOptional() // Opcjonalny, bo nie zawsze chcemy zmieniać email
    email?: string;

    @IsEnum(Role) // Sprawdza, czy wartość jest jedną z zdefiniowanych ról
    @IsOptional()
    role?: Role;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    fullName: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    taxId: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    addressLine1: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    addressLine2: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    city: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    zipCode: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    country: string;
}