import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateServiceDto {
    @IsString()
    @IsNotEmpty()
    name: string; // np. "Mój blog WordPress"

    @IsUUID() // Walidator sprawdzający, czy to poprawny format UUID
    userId: string;

    @IsUUID()
    planId: string;
}