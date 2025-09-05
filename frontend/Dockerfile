FROM node:23.11.1-alpine3.22 AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# Build stage for local testing
FROM node:23.11.1-alpine3.22 as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments
ARG VITE_API_URL
ARG VITE_APP_NAME

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

# Build the application
RUN npm run build

