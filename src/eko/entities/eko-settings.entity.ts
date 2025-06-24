import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'eko_settings' })
export class EkoSettings {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'points_per_pln', type: 'integer', default: 100 })
    pointsPerPln: number; // Ile punktów jest warte 1 PLN

    @Column({ name: 'points_to_plant_tree', type: 'integer', default: 10000 })
    pointsToPlantTree: number; // Ile punktów trzeba zebrać, by "ufundować" drzewo

    // Punkty za konkretne akcje
    @Column({ name: 'points_for_dark_mode', type: 'integer', default: 50 })
    pointsForDarkMode: number;

    @Column({ name: 'points_for_2fa', type: 'integer', default: 200 })
    pointsFor2FA: number;

    @Column({ name: 'points_for_auto_renew', type: 'integer', default: 100 })
    pointsForAutoRenew: number;

    @Column({ name: 'points_for_yearly_payment', type: 'integer', default: 500 })
    pointsForYearlyPayment: number;
}