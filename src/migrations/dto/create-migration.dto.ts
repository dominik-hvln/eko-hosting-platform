import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMigrationDto {
    @IsString()
    @IsNotEmpty()
    ftpHost: string;

    @IsString()
    @IsNotEmpty()
    ftpUsername: string;

    @IsString()
    @IsNotEmpty()
    ftpPassword: string;

    @IsString()
    @IsOptional()
    mysqlHost?: string;

    @IsString()
    @IsOptional()
    mysqlUsername?: string;

    @IsString()
    @IsOptional()
    mysqlPassword?: string;

    @IsString()
    @IsOptional()
    mysqlDatabase?: string;
}