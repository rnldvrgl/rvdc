# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy source and install
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine
WORKDIR /app

# Copy built files and package.json
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Install only production dependencies
RUN npm ci --production

# Expose port and start with PM2
RUN npm install -g pm2
EXPOSE 3000
CMD ["pm2-runtime", "npm", "--name", "rvdc", "--", "start"]
