# 1. Базовый образ (ОС + Node.js 18)
FROM node:18-alpine

# 2. Рабочая папка внутри контейнера
WORKDIR /app

# 3. Копируем файл зависимостей (для кеширования)
COPY package*.json ./

# 4. Устанавливаем зависимости (npm install внутри контейнера!)
RUN npm install --legacy-peer-deps

# 5. Копируем весь твой код в контейнер
COPY . .

# 6. Генерируем клиент Prisma (обязательно для твоего БД)
RUN npx prisma generate

# 7. Открываем порт 3000
EXPOSE 3000

# 8. Команда запуска сервера
CMD ["npm", "run", "dev"]