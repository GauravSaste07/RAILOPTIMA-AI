# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server accessible externally
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
