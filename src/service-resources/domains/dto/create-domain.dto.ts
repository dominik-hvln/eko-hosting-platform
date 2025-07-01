// Stwórz plik: src/service-resources/domains/dto/create-domain.dto.ts
import { IsNotEmpty, IsString, Matches } from 'class-validator';
export class CreateDomainDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, { message: 'Proszę podać poprawną nazwę domeny.' })
    name: string;
}