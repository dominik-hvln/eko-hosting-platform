import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';

@Entity({ name: 'plans' })
export class Plan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string; // np. "Basic", "Pro", "Enterprise"

    @Column({ type: 'text', nullable: true })
    description: string | null;

    // Używamy typu decimal dla precyzji finansowej
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: string;

    @Column({ name: 'yearly_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
    yearlyPrice: string | null;

    // Limity zasobów (przykładowe)
    @Column({ name: 'cpu_limit' })
    cpuLimit: number; // np. w % lub vCores

    @Column({ name: 'ram_limit' })
    ramLimit: number; // np. w MB

    @Column({ name: 'disk_space_limit' })
    diskSpaceLimit: number; // np. w MB

    @Column({ name: 'monthly_transfer_limit' })
    monthlyTransferLimit: number; // np. w GB

    // Czy plan jest publicznie widoczny i dostępny do zakupu
    @Column({ name: 'is_public', default: true })
    isPublic: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Service, (service) => service.plan)
    services: Service[];
}