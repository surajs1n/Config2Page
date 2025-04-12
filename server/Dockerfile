# Build stage
FROM node:18-alpine as builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy environment file if it exists
COPY .env* ./

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "dist/index.js"]
