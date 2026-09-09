# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first
COPY package.json package-lock.json ./

# Install all dependencies including dev dependencies
RUN npm ci

# Copy the complete project
COPY . .

# Build frontend and backend
RUN npm run build


# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the compiled application
COPY --from=builder /app/dist ./dist

# Application port
EXPOSE 3000

# Production environment
ENV NODE_ENV=production

# Start application
CMD ["npm", "start"]