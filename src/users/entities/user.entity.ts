import { Role } from '../../common/enums/role.enum';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' }) // Mówi TypeORM, że ta klasa to encja mapowana na tabelę 'users'
export class User {
    @PrimaryGeneratedColumn('uuid') // Klucz główny, automatycznie generowany jako UUID
    id: string;

    @Column({ unique: true }) // Kolumna z adresem email, musi być unikalny
    email: string;

    @Column() // Kolumna z hasłem (będziemy je hashować przed zapisem)
    password: string;

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.USER, // Domyślna rola to 'user'
    })
    role: Role;

    @Column({ default: true }) // Kolumna do aktywacji/deaktywacji konta
    isActive: boolean;

    @CreateDateColumn() // Automatycznie ustawiana data utworzenia
    createdAt: Date;

    @UpdateDateColumn() // Automatycznie ustawiana data ostatniej aktualizacji
    updatedAt: Date;
}