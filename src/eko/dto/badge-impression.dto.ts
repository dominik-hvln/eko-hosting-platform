import { IsUUID } from 'class-validator';

export class BadgeImpressionDto {
    @IsUUID()
    userId: string;
}