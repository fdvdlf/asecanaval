FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma

RUN npm install
RUN npm run prisma:generate

COPY src ./src

RUN npm run build

EXPOSE 3100

CMD ["sh", "-c", "if [ ! -f dist/src/main.js ]; then npm run build; fi; node dist/src/main.js"]
