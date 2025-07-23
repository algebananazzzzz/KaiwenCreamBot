package main

import (
	"context"
	"fmt"

	"github.com/aws/aws-lambda-go/lambda"
)

func handler(ctx context.Context) (string, error) {
	return "Hello from Go Lambda!", nil
}

func main() {
	fmt.Println("Starting Lambda...")
	lambda.Start(handler)
}
