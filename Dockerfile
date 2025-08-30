# -------- Stage 1: Build the application --------
# Use a lightweight Node.js image with npm for building
FROM node:20-bookworm AS build

# Set working directory inside container
WORKDIR /app

# Copy all files (including package.json and tsconfig.json)
COPY ./src ./

# Install all dependencies (production + dev)
RUN npm ci

# Build the TypeScript project (output to /app/dist)
RUN npm run build

# -------- Stage 2: Create the runtime image --------
# Use Lambda base image
FROM public.ecr.aws/lambda/nodejs:22

# Set working directory inside runtime container
WORKDIR /app

# Copy built app and required files from the build stage
COPY --from=build /app/dist ${LAMBDA_TASK_ROOT}
COPY --from=build /app/node_modules ${LAMBDA_TASK_ROOT}/node_modules
COPY --from=build /app/package.json ${LAMBDA_TASK_ROOT}

# Set environment variables
ENV ENVIRONMENT=production

CMD [ "index.handler" ]