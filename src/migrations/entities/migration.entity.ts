import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MigrationStatus } from '../../common/enums/migration-status.enum';

@Entity({ name: 'migration_requests' })
export class MigrationRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: MigrationStatus, default: MigrationStatus.PENDING })
    status: MigrationStatus;

    @Column({ type: 'varchar', name: 'ftp_host' }) // <-- DODAJEMY JAWNY TYP
    ftpHost: string;

    @Column({ type: 'varchar', name: 'ftp_username' }) // <-- DODAJEMY JAWNY TYP
    ftpUsername: string;

    @Column({ name: 'ftp_password', type: 'text' })
    ftpPassword: string;

    @Column({ type: 'varchar', name: 'mysql_host', nullable: true }) // <-- DODAJEMY JAWNY TYP
    mysqlHost: string | null;

    @Column({ type: 'varchar', name: 'mysql_username', nullable: true }) // <-- DODAJEMY JAWNY TYP
    mysqlUsername: string | null;

    @Column({ name: 'mysql_password', type: 'text', nullable: true })
    mysqlPassword: string | null;

    @Column({ type: 'varchar', name: 'mysql_database', nullable: true }) // <-- DODAJEMY JAWNY TYP
    mysqlDatabase: string | null;

    // Przywracamy relację - teraz powinna działać
    @ManyToOne(() => User, (user) => user.migrationRequests)
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}