# Stage 1: install production dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Stage 2: final runtime image
FROM node:20-alpine AS runner
WORKDIR /app

# Copy installed modules and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
EXPOSE 8000

CMD ["node", "server.js"]
