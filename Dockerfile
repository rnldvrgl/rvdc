# Use multi-stage build for SSR: deps -> build -> runtime (Next.js server)
# Stage 1: install dependencies based on lockfile when available
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package manifest and lockfile; prefer ci when lockfile exists
COPY package.json package-lock.json* ./
# Try npm ci first (deterministic), fall back to npm install if lockfile not present/valid
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Stage 2: build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app

# Reuse node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application source
COPY . .

# Build SSR output (generates .next)
RUN npx next build

# Stage 3: production runtime (SSR server)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what the server needs at runtime
COPY package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=deps /app/node_modules ./node_modules

# Expose Next.js server port
EXPOSE 3000

# Start Next.js in production mode
CMD ["npx", "next", "start", "-p", "3000"]
