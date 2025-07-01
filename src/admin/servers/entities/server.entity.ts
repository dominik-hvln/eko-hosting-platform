// src/admin/servers/entities/server.entity.ts

import { ServerStatus } from '../../../common/enums/server-status.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'servers' })
export class Server {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ name: 'ip_address' })
  ipAddress: string;

  @Column({ name: 'ssh_port', default: 22 })
  sshPort: number;

  @Column({ name: 'ssh_user', default: 'root' })
  sshUser: string;

  // Klucz prywatny będzie przechowywany w formie zaszyfrowanej
  @Column({ name: 'ssh_private_key', type: 'text' })
  sshPrivateKey: string;

  @Column({
    type: 'enum',
    enum: ServerStatus,
    default: ServerStatus.OFFLINE,
  })
  status: ServerStatus;

  // Prosty wskaźnik obciążenia, który będziemy rozwijać w przyszłości
  @Column({ name: 'load_index', type: 'integer', default: 0 })
  loadIndex: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
