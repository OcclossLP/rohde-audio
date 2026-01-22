# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

RUN pnpm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY .env .env

EXPOSE 3000

CMD ["pnpm", "start"]
