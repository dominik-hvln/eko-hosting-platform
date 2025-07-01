export class DatabaseCredentialsDto {
    id: string;
    name: string;
    user: string;
    password?: string; // Hasło będzie opcjonalne
}