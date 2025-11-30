FROM node:18-alpine

WORKDIR /app

# Copia i file di dipendenze del backend
COPY package.json package-lock.json* ./

# Installa le dipendenze
RUN npm install

# Copia il resto del codice backend (incluso schema.prisma)
COPY . .

# Genera il client Prisma
RUN npx prisma generate

EXPOSE 3000

# Il comando di avvio è gestito dal docker-compose per includere le migrazioni, 
# ma qui mettiamo un default sensato.
CMD ["node", "index.js"]