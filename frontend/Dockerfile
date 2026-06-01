FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Expose Vite dev port
EXPOSE 5173

# Run Vite with host flag so it's accessible outside the container
CMD ["npm", "run", "dev", "--", "--host"]
