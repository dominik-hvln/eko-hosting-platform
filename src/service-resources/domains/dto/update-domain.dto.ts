// Stwórz plik: src/service-resources/domains/dto/update-domain.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
export class UpdateDomainDto {
    @IsString()
    @IsNotEmpty()
    phpVersion: string;
}