# Multi-stage Dockerfile for IFTA Gestão Técnica de Ativos & Manutenção
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy all source files
COPY . .

# Compile application into static bundle in /app/dist
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy package manifests and install only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Expose port 3000 for localhost testing
EXPOSE 3000

# Start server on 0.0.0.0:3000
CMD ["npm", "run", "preview"]
