# Stage 1: Build Frontend
FROM node:18-alpine as build

WORKDIR /app

# Copia i file di dipendenze
COPY package.json package-lock.json* ./

# Installa le dipendenze
RUN npm install

# Copia il codice sorgente
COPY . .

# Esegui la build di produzione (Vite)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copia i file compilati dallo stage precedente alla directory di Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia una configurazione Nginx di base (opzionale, ma consigliata per gestire il routing di React)
# Creiamo una configurazione inline semplice per supportare il routing lato client
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://api:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]