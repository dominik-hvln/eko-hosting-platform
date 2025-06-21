import { Injectable } from '@nestjs/common';
import { CreateMigrationDto } from './dto/create-migration.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MigrationRequest } from './entities/migration.entity';
import { Repository } from 'typeorm';
import { EncryptionService } from '../common/encryption/encryption.service';

@Injectable()
export class MigrationsService {
  constructor(
      @InjectRepository(MigrationRequest)
      private readonly migrationsRepository: Repository<MigrationRequest>,
      private readonly encryptionService: EncryptionService,
  ) {}

  async create(
      createMigrationDto: CreateMigrationDto,
      userId: string,
  ): Promise<MigrationRequest> {
    // Szyfrujemy hasła przed utworzeniem obiektu
    const encryptedFtpPassword = this.encryptionService.encrypt(
        createMigrationDto.ftpPassword,
    );
    const encryptedMysqlPassword = createMigrationDto.mysqlPassword
        ? this.encryptionService.encrypt(createMigrationDto.mysqlPassword)
        : null;

    const newMigrationRequest = this.migrationsRepository.create({
      ...createMigrationDto,
      ftpPassword: encryptedFtpPassword,
      mysqlPassword: encryptedMysqlPassword,
    });

    return this.migrationsRepository.save(newMigrationRequest);
  }
}