# Stage 1: Build Go binary
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git and SSL libraries if needed
RUN apk add --no-cache git

# Copy and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build
COPY src/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bootstrap main.go

# Stage 2: Lambda-compatible runtime
FROM public.ecr.aws/lambda/provided:al2

# Copy built binary
COPY --from=builder /app/bootstrap /var/task/bootstrap
RUN chmod +x /var/task/bootstrap

# Lambda will call /var/task/bootstrap by default
CMD ["/var/task/bootstrap"]
