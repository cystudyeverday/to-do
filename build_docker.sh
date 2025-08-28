r#!/bin/bash

# Set variables
IMAGE_NAME="my-todo-app"
CONTAINER_NAME="my-todo-container"
PORT=5000

echo "🐳 Building Docker image for my-todo-app..."
# Remove the old image if it exists (optional, uncomment if you want to clean up old images)
docker rmi $IMAGE_NAME 2>/dev/null || true
# Build the Docker image
docker build -t $IMAGE_NAME .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker image built successfully!"

# Stop and remove the old container if it exists
echo "🔄 Stopping and removing old container if it exists..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true



# Run the new container
echo "🚀 Starting new container on port $PORT..."
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:3000 \
    --restart unless-stopped \
    $IMAGE_NAME

if [ $? -eq 0 ]; then
    echo "✅ Container started successfully!"
    echo "🌐 Your app is now running at: http://localhost:$PORT"
    echo "📊 Container status:"
    docker ps --filter "name=$CONTAINER_NAME"
else
    echo "❌ Failed to start container!"
    exit 1
fi
