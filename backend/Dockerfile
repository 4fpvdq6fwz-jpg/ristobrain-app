FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
# Copy SQL files needed for migrations
COPY --from=builder /app/src/db ./dist/db
EXPOSE 4000
ENV NODE_ENV=production
CMD ["npm", "start"]
