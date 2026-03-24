FROM node:18-alpine AS builder

WORKDIR /app

# Копируем tsconfig.json
COPY tsconfig.json ./

# Устанавливаем TypeScript
RUN npm install -g typescript

# Копируем исходники
COPY scripts/ ./scripts/

# Компилируем TypeScript → JavaScript
# Файлы появятся в dist/scripts/
RUN tsc

# Production stage с nginx
FROM nginx:alpine

# Копируем HTML файлы
COPY index.html /usr/share/nginx/html/
COPY employees.html /usr/share/nginx/html/
COPY project.html /usr/share/nginx/html/

# 👇 КОПИРУЕМ dist/scripts (не scripts!)
COPY --from=builder /app/dist/scripts /usr/share/nginx/html/dist/scripts

# Копируем статику
COPY css/ /usr/share/nginx/html/css/
COPY image/ /usr/share/nginx/html/image/
COPY fonts/ /usr/share/nginx/html/fonts/

# Копируем nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]