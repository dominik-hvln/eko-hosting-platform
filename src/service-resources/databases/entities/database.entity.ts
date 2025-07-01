// src/service-resources/databases/entities/database.entity.ts
import { Service } from '../../../services/entities/service.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'databases' })
export class Database {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  user: string;

  @Exclude()
  @Column({ type: 'text' }) // Szyfrowane
  password: string;

  @ManyToOne(() => Service, (service) => service.databases, {
    onDelete: 'CASCADE',
  })
  service: Service;
}
