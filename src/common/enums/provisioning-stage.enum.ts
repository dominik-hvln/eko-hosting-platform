export enum ProvisioningStage {
    PENDING = 'pending', // Oczekuje na rozpoczęcie
    CLOUDLINUX_DONE = 'cloudlinux_done', // Etap 1 zakończony
    LITESPEED_DONE = 'litespeed_done', // Etap 2 zakończony
    COMPLETED = 'completed', // Wszystkie etapy zakończone
    FAILED = 'failed', // <-- PRZYWRACAMY TEN STAN, ABY NAPRAWIĆ BŁĄD BAZY DANYCH
}