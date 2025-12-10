#!/usr/bin/env bash
# ./clean-docker.sh [days]
# Clean unused Docker images older than specified days (default: 30 days)
# Usage:
#   ./clean-docker.sh          # Clean images older than 30 days
#   ./clean-docker.sh 7        # Clean images older than 7 days
#   ./clean-docker.sh --dry-run # Preview what would be removed (30 days default)
#   ./clean-docker.sh 14 --dry-run # Preview what would be removed (14 days)

DAYS_OLD=30
DRY_RUN=false

# Parse arguments
for arg in "$@"; do
    if [[ "$arg" == "--dry-run" ]]; then
        DRY_RUN=true
    elif [[ "$arg" =~ ^[0-9]+$ ]]; then
        DAYS_OLD=$arg
    fi
done

RED=`tput setaf 1`
GREEN=`tput setaf 2`
YELLOW=`tput setaf 11`
BLUE=`tput setaf 4`
RESET=`tput sgr0`

cd `dirname $0`
echo "Start from folder:${YELLOW}`pwd`${RESET}"

if [ "$DRY_RUN" = true ]; then
    echo "${BLUE}DRY RUN MODE - No images will be deleted${RESET}"
fi

echo "${GREEN}Cleaning Docker images older than ${DAYS_OLD} days${RESET}"
echo ""

# Function to format bytes
format_size() {
    local bytes=$1
    if [ $bytes -gt 1073741824 ]; then
        echo "$(echo "scale=2; $bytes/1073741824" | bc)GB"
    elif [ $bytes -gt 1048576 ]; then
        echo "$(echo "scale=2; $bytes/1048576" | bc)MB"
    elif [ $bytes -gt 1024 ]; then
        echo "$(echo "scale=2; $bytes/1024" | bc)KB"
    else
        echo "${bytes}B"
    fi
}

# Step 1: Remove dangling images (untagged images)
echo "${YELLOW}Step 1: Removing dangling images...${RESET}"
DANGLING_IMAGES=$(sudo docker images -f "dangling=true" -q)
if [ -z "$DANGLING_IMAGES" ]; then
    echo "${GREEN}No dangling images found${RESET}"
else
    DANGLING_COUNT=$(echo "$DANGLING_IMAGES" | wc -l)
    echo "Found ${YELLOW}${DANGLING_COUNT}${RESET} dangling image(s)"
    if [ "$DRY_RUN" = false ]; then
        sudo docker rmi $DANGLING_IMAGES 2>/dev/null || true
        echo "${GREEN}Dangling images removed${RESET}"
    else
        echo "${BLUE}Would remove dangling images:${RESET}"
        sudo docker images -f "dangling=true" --format "  {{.Repository}}:{{.Tag}} ({{.ID}})"
    fi
fi
echo ""

# Step 2: Remove unused images older than specified days
echo "${YELLOW}Step 2: Removing unused images older than ${DAYS_OLD} days...${RESET}"

# Get images older than specified days (excluding dangling)
OLD_IMAGES=$(sudo docker images --format "{{.ID}}|{{.Repository}}|{{.Tag}}|{{.Size}}|{{.CreatedAt}}" --filter "dangling=false" | while IFS='|' read -r id repo tag size created; do
    # Calculate age in days
    CREATED_EPOCH=$(date -d "$created" +%s 2>/dev/null || echo "0")
    if [ "$CREATED_EPOCH" != "0" ]; then
        CURRENT_EPOCH=$(date +%s)
        AGE_DAYS=$(( (CURRENT_EPOCH - CREATED_EPOCH) / 86400 ))
        if [ $AGE_DAYS -ge $DAYS_OLD ]; then
            echo "${id}|${repo}|${tag}|${size}|${AGE_DAYS}"
        fi
    fi
done)

TOTAL_SIZE=0
REMOVED_COUNT=0

if [ -z "$OLD_IMAGES" ]; then
    echo "${GREEN}No unused images older than ${DAYS_OLD} days found${RESET}"
else
    while IFS='|' read -r image_id repository tag image_size age_days; do
        # Skip if image is currently used by any running container
        IN_USE=$(sudo docker ps --format "{{.Image}}" 2>/dev/null | grep -E "^${repository}:${tag}$|^${image_id}$" || true)
        if [ -n "$IN_USE" ]; then
            echo "  ${BLUE}Skipping ${repository}:${tag} (in use by running container)${RESET}"
            continue
        fi
        
        echo "  ${YELLOW}${repository}:${tag}${RESET} (${age_days} days old, ${image_size})"
        
        if [ "$DRY_RUN" = false ]; then
            if sudo docker rmi $image_id 2>/dev/null; then
                REMOVED_COUNT=$((REMOVED_COUNT + 1))
                # Try to get actual size
                SIZE_BYTES=$(sudo docker inspect -f "{{.Size}}" $image_id 2>/dev/null || echo "0")
                TOTAL_SIZE=$((TOTAL_SIZE + SIZE_BYTES))
            else
                echo "    ${RED}Failed to remove (may be in use)${RESET}"
            fi
        else
            REMOVED_COUNT=$((REMOVED_COUNT + 1))
            SIZE_BYTES=$(sudo docker inspect -f "{{.Size}}" $image_id 2>/dev/null || echo "0")
            TOTAL_SIZE=$((TOTAL_SIZE + SIZE_BYTES))
        fi
    done <<< "$OLD_IMAGES"
    
    if [ $REMOVED_COUNT -gt 0 ]; then
        if [ "$DRY_RUN" = false ]; then
            echo ""
            echo "${GREEN}Removed ${REMOVED_COUNT} image(s)${RESET}"
            if [ $TOTAL_SIZE -gt 0 ]; then
                echo "${GREEN}Freed approximately $(format_size $TOTAL_SIZE)${RESET}"
            fi
        else
            echo ""
            echo "${BLUE}Would remove ${REMOVED_COUNT} image(s)${RESET}"
            if [ $TOTAL_SIZE -gt 0 ]; then
                echo "${BLUE}Would free approximately $(format_size $TOTAL_SIZE)${RESET}"
            fi
        fi
    fi
fi
echo ""

# Step 3: Prune system (optional - removes unused containers, networks, build cache)
echo "${YELLOW}Step 3: Pruning Docker system (containers, networks, build cache)...${RESET}"
if [ "$DRY_RUN" = false ]; then
    PRUNE_OUTPUT=$(sudo docker system prune -af --volumes 2>&1)
    echo "${GREEN}System prune completed${RESET}"
    echo "$PRUNE_OUTPUT" | grep -E "Total reclaimed space|Deleted" || true
else
    echo "${BLUE}Would run: sudo docker system prune -af --volumes${RESET}"
    echo "${BLUE}This would remove unused containers, networks, and build cache${RESET}"
fi
echo ""

echo "${GREEN}Cleanup completed!${RESET}"

