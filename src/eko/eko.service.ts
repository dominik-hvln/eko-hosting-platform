import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EkoSettings } from './entities/eko-settings.entity';
import { Repository } from 'typeorm';
import { UpdateEkoSettingsDto } from './dto/update-eko-settings.dto';

@Injectable()
export class EkoService {
  constructor(
      @InjectRepository(EkoSettings)
      private readonly settingsRepository: Repository<EkoSettings>,
  ) {}

  // Pobiera ustawienia. Jeśli nie istnieją, tworzy domyślne.
  async getSettings(): Promise<EkoSettings> {
    const settings = await this.settingsRepository.find();
    if (settings.length > 0) {
      return settings[0];
    }
    return this.settingsRepository.save(new EkoSettings());
  }

  // Aktualizuje ustawienia
  async updateSettings(dto: UpdateEkoSettingsDto): Promise<EkoSettings> {
    let settings = await this.getSettings();
    Object.assign(settings, dto);
    return this.settingsRepository.save(settings);
  }
}