// Argumenty potrzebne do stworzenia sesji płatności
export interface CreateSessionArgs {
    amount: number;
    currency: string;
    userEmail: string;
    successUrl: string;
    cancelUrl: string;
    paymentDescription: string;
    metadata?: { [key: string]: string | number | null };
}

// Wynik, jaki zwraca metoda tworząca sesję
export interface CreateSessionResult {
    paymentUrl: string; // URL do strony płatności
    sessionId: string; // ID sesji u dostawcy
}

// Nasz kontrakt
export interface PaymentProvider {
    createPaymentSession(args: CreateSessionArgs): Promise<CreateSessionResult>;
}