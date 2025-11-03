# Install dependencies and build the app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY ./prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
COPY ./prisma ./prisma
RUN npm ci --omit=dev
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder /app/api ./api
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "run", "start"]