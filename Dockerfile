# -------- Stage 1: Build the application --------
# Use a lightweight Node.js image with npm for building
FROM node:20-bookworm AS build

# Set working directory inside container
WORKDIR /app

# Copy all files (including package.json and tsconfig.json)
COPY ./src ./

# Install build dependencies
RUN apt-get update && \
    apt-get install -y \
    g++ \
    make \
    cmake \
    unzip \
    libcurl4-openssl-dev

# Install all dependencies (production + dev)
RUN npm ci

# Install the lambda runtime interface client
RUN npm install aws-lambda-ric

# Build the TypeScript project (output to /app/dist)
RUN npm run build

# Required for Node runtimes which use npm@8.6.0+ because
# by default npm writes logs under /home/.npm and Lambda fs is read-only
ENV NPM_CONFIG_CACHE=/tmp/.npm

# -------- Stage 2: Create the runtime image --------
# Use Puppeteer base image with Chromium and deps preinstalled
FROM ghcr.io/puppeteer/puppeteer:22.15.0

# Set working directory inside runtime container
WORKDIR /app

# Copy built app and required files from the build stage
COPY --from=build /app/dist ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json .

# Set environment variables
ENV ENVIRONMENT=production

# Set runtime interface client as default command for the container runtime
ENTRYPOINT ["/usr/local/bin/npx", "aws-lambda-ric"]
# Pass the name of the function handler as an argument to the runtime
CMD ["index.handler"]
