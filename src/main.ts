import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { json } from 'express'; // Ważne: importujemy 'json' bezpośrednio z express

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Wyłączamy domyślny parser NestJS, aby za chwilę dodać własny z express
    bodyParser: false,
  });

  // Dodajemy globalny parser JSON z limitem i kluczową opcją 'verify'
  app.use(
      json({
        // Funkcja 'verify' jest sercem rozwiązania.
        // Uruchamia się dla każdego żądania i zapisuje jego surową treść
        // w nowej właściwości `rawBody`, zanim przekaże je dalej.
        verify: (req: any, res, buf) => {
          req.rawBody = buf;
        },
      }),
  );

  // Reszta konfiguracji bez zmian
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(3000);
}
bootstrap();