import { IsBoolean, IsEmail, IsEnum, IsOptional } from 'class-validator';
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