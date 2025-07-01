// src/main.ts

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const httpsOptions: { key?: Buffer; cert?: Buffer } = {};

  try {
    // ZMIANA 1: Używamy process.cwd(), aby zbudować absolutną ścieżkę od folderu głównego projektu.
    // To jest znacznie bardziej niezawodne w środowisku Docker.
    const keyPath = path.join(process.cwd(), 'ssl', 'localhost-key.pem');
    const certPath = path.join(process.cwd(), 'ssl', 'localhost.pem');

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      httpsOptions.key = fs.readFileSync(keyPath);
      httpsOptions.cert = fs.readFileSync(certPath);
      console.log(
        'Certyfikaty SSL załadowane. Uruchamianie serwera w trybie HTTPS.',
      );
    } else {
      console.log(
        'Nie znaleziono certyfikatów SSL w folderze /ssl. Uruchamianie serwera w standardowym trybie HTTP.',
      );
    }
  } catch (err) {
    console.error('Błąd podczas ładowania certyfikatów SSL:', err);
  }

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    httpsOptions:
      httpsOptions.key && httpsOptions.cert ? httpsOptions : undefined,
  });

  const allowedOrigins = ['http://localhost:3000', 'https://localhost:3001'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Niedozwolone przez CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(
    json({
      verify: (req: any, res, buf) => {
        if (
          req.url.startsWith('/payments/webhook/stripe') ||
          req.url.startsWith('/payments/webhook/payu')
        ) {
          req.rawBody = buf;
        }
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // ZMIANA 2: Nakazujemy aplikacji nasłuchiwać na '0.0.0.0'.
  // Dzięki temu będzie ona dostępna z zewnątrz kontenera Dockera.
  await app.listen(4000, '0.0.0.0');
  console.log(`Aplikacja backendu działa na: ${await app.getUrl()}`);
}

bootstrap();
