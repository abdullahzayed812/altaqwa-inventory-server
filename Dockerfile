FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Copy static assets to dist (tsc doesn't do this)
RUN cp src/infrastructure/database/schema.sql dist/infrastructure/database/

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
