# Stage 1: Build
FROM node:22.12.0 as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22.12.0-slim

ARG SERVER_PORT=3001
ENV SERVER_PORT=${SERVER_PORT}

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules

EXPOSE ${SERVER_PORT}
CMD ["node", "server/app.js"]