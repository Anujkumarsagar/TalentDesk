FROM node:22-alpine

WORKDIR /app

ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV REDIS_URL=redis://localhost:6379
ENV JWT_SECRET=build-time-placeholder-secret

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate && npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]
