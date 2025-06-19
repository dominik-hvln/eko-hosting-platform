import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsEmail() // Sprawdza, czy to poprawny format e-mail
    email: string;

    @IsString() // Sprawdza, czy to ciąg znaków
    @MinLength(8, { message: 'Password must be at least 8 characters long' }) // Sprawdza minimalną długość
    password: string;
}