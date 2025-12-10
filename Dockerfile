# Use Node.js LTS
FROM node:20-alpine

WORKDIR /app

# Copy everything including the env file
COPY . .

# Make sure env vars are available at build time
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

# Install dependencies
RUN npm ci

# Build the app
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Run Next.js server
CMD ["npm", "start"]
