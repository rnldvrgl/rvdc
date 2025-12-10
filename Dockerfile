# Use Node.js LTS
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port 3000 (Next.js default)
EXPOSE 3000

# Run Next.js server
CMD ["npm", "start"]
