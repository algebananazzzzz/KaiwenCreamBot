# -------- Stage 1: Build the application --------
# Use a lightweight Node.js image with npm for building
FROM node:20-alpine AS build

# Set working directory inside container
WORKDIR /app

# Copy all files (including package.json and tsconfig.json)
COPY ./package*.json ./
COPY ./esbuild.config.mjs ./
COPY ./src ./src

# Install all dependencies (production + dev)
RUN npm ci

# Build the TypeScript project (output to /app/dist)
RUN npm run build

# -------- Stage 2: Create the runtime image --------
# Use Puppeteer base image with Chromium and deps preinstalled
FROM ghcr.io/puppeteer/puppeteer:22.15.0

# Set working directory inside runtime container
WORKDIR /app

# Copy built app and required files from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json .

# Set environment variables
ENV ENVIRONMENT=production

# Define default command to run the bot
CMD ["node", "dist/index.js"]
