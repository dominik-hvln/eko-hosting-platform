# ETAP 1: Budowanie aplikacji
FROM node:20 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ETAP 2: Tworzenie finalnego, lekkiego obrazu
FROM node:20-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json
# ----> DODAJEMY TĘ LINIĘ <----
# Kopiujemy pliki konfiguracyjne TypeScripta
COPY --from=builder /usr/src/app/tsconfig*.json ./
COPY assets ./assets

EXPOSE 3000
CMD [ "node", "dist/main" ]