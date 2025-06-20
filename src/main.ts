import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { json } from 'express'; // Ważne: importujemy 'json' bezpośrednio z express

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.use(
      json({
        verify: (req: any, res, buf) => {
            if (
                req.url.startsWith('/payments/webhook/stripe') ||
                req.url.startsWith('/payments/webhook/payu')
            ) {
                // Jeśli tak, dołączamy surowe body
                req.rawBody = buf;
            }
        },
      }),
  );

  // Reszta konfiguracji bez zmian
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(3000);
}
bootstrap();