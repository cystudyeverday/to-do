#!/usr/bin/env bash
# ./build-docker.sh dev
# Updated the script. When you run ./build-docker.sh dev:
# Tags the image as development instead of latest
# Sets the build environment to development
# Matches the icac-frontend-dev service in docker-compose.yml, which uses astribigdata/icac-frontend:development

# ./build-docker.sh 
# When run without arguments or with prod, it still tags as latest as before.
VERION="1.0"

DOCKER_USER="caiyang"

MODULE_NAME="my-todo-app"
IMAGE_NAME="${DOCKER_USER}/${MODULE_NAME}:${VERION}"
IMAGE_LATEST="${DOCKER_USER}/${MODULE_NAME}:latest"

RED=`tput setaf 1`
GREEN=`tput setaf 2`
YELLOW=`tput setaf 11`
RESET=`tput sgr0`

cd `dirname $0`
echo "Start from folder:${YELLOW}`pwd`${RESET}"

# Use 'prod' environment for icac-frontend-dev service, or pass ENVIRONMENT as argument
ENVIRONMENT=${1:-prod}
# Use 'development' tag for dev builds, 'latest' for prod builds
if [ "${ENVIRONMENT}" = "dev" ]; then
    IMAGE_TAG="${DOCKER_USER}/${MODULE_NAME}:development"
    ENVIRONMENT="development"
else
    IMAGE_TAG="${IMAGE_LATEST}"
fi
echo "Image Name:${YELLOW} ${IMAGE_TAG}${RESET}"
echo "${GREEN}Creating Docker Image${RESET}"
echo "Building with environment: ${YELLOW}${ENVIRONMENT}${RESET}"
sudo docker build --build-arg ENVIRONMENT=${ENVIRONMENT} --build-arg MODULE_NAME=${MODULE_NAME} -t ${IMAGE_TAG} .
echo "${GREEN}Done${RESET}"

echo "run docker compose up"
sudo docker compose down
sudo docker compose up -d
