import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDatabaseDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(16, { message: 'Nazwa bazy danych może mieć maksymalnie 16 znaków.'})
    name: string; // Użytkownik podaje tylko nazwę, reszta jest generowana
}