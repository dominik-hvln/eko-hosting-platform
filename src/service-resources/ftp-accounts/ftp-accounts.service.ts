import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FtpAccount } from './entities/ftp-account.entity';
import { CreateFtpAccountDto } from './dto/create-ftp-account.dto';
import { ServicesService } from '../../services/services.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import * as crypto from 'crypto';

@Injectable()
export class FtpAccountsService {
  private readonly logger = new Logger(FtpAccountsService.name);

  constructor(
    @InjectRepository(FtpAccount)
    private readonly ftpAccountsRepository: Repository<FtpAccount>,
    private readonly servicesService: ServicesService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async findAllForService(
    serviceId: string,
    userId: string,
  ): Promise<Omit<FtpAccount, 'password'>[]> {
    await this.servicesService.findOneForUser(serviceId, userId);
    return this.ftpAccountsRepository.find({
      where: { service: { id: serviceId } },
      select: ['id', 'username', 'path'],
    });
  }

  async create(
    createDto: CreateFtpAccountDto,
    serviceId: string,
    userId: string,
  ): Promise<Omit<FtpAccount, 'password'>> {
    const service = await this.servicesService.findOneForUser(
      serviceId,
      userId,
    );
    const generatedPassword = crypto.randomBytes(12).toString('hex');
    const ftpAccount = this.ftpAccountsRepository.create({
      username: createDto.username,
      path: createDto.path,
      password: this.encryptionService.encrypt(generatedPassword),
      service,
    });
    const saved = await this.ftpAccountsRepository.save(ftpAccount);
    this.logger.log(
      `Utworzono konto FTP ${saved.username} dla usługi ${serviceId}`,
    );
    const { password: _ignored, ...rest } = saved;
    return rest;
  }

  async remove(id: string, serviceId: string, userId: string): Promise<void> {
    await this.servicesService.findOneForUser(serviceId, userId);
    await this.ftpAccountsRepository.delete({ id, service: { id: serviceId } });
  }
}
