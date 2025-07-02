import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailAccount } from './entities/email-account.entity';
import { CreateEmailAccountDto } from './dto/create-email-account.dto';
import { ServicesService } from '../../services/services.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import * as crypto from 'crypto';

@Injectable()
export class EmailAccountsService {
  private readonly logger = new Logger(EmailAccountsService.name);

  constructor(
    @InjectRepository(EmailAccount)
    private readonly emailAccountsRepository: Repository<EmailAccount>,
    private readonly servicesService: ServicesService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async findAllForService(
    serviceId: string,
    userId: string,
  ): Promise<Omit<EmailAccount, 'password'>[]> {
    await this.servicesService.findOneForUser(serviceId, userId);
    return this.emailAccountsRepository.find({
      where: { service: { id: serviceId } },
      select: ['id', 'emailAddress', 'quotaMb'],
      relations: ['domain'],
    });
  }

  async create(
    dto: CreateEmailAccountDto,
    serviceId: string,
    domainId: string,
    userId: string,
  ): Promise<Omit<EmailAccount, 'password'>> {
    const service = await this.servicesService.findOneForUser(
      serviceId,
      userId,
    );
    const generatedPassword = crypto.randomBytes(12).toString('hex');
    const emailAccount = this.emailAccountsRepository.create({
      emailAddress: dto.emailAddress,
      quotaMb: dto.quotaMb ?? 1024,
      password: this.encryptionService.encrypt(generatedPassword),
      service,
      domain: { id: domainId } as any,
    });
    const saved = await this.emailAccountsRepository.save(emailAccount);
    this.logger.log(
      `Utworzono konto e-mail ${saved.emailAddress} dla usługi ${serviceId}`,
    );
    const { password: _ignored, ...rest } = saved;
    return rest;
  }

  async remove(id: string, serviceId: string, userId: string): Promise<void> {
    await this.servicesService.findOneForUser(serviceId, userId);
    await this.emailAccountsRepository.delete({
      id,
      service: { id: serviceId },
    });
  }
}
