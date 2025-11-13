#!/bin/bash

echo "Setting up production environment for video streaming..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Check and install FFmpeg
echo -e "${YELLOW}Checking FFmpeg installation...${NC}"
if ! command_exists ffmpeg; then
    echo -e "${YELLOW}FFmpeg not found. Installing...${NC}"
    
    # Detect OS and install FFmpeg
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists apt-get; then
            # Debian/Ubuntu
            sudo apt-get update
            sudo apt-get install -y ffmpeg
        elif command_exists yum; then
            # CentOS/RHEL/Fedora
            sudo yum install -y epel-release
            sudo yum install -y ffmpeg
        elif command_exists dnf; then
            # Newer Fedora
            sudo dnf install -y ffmpeg
        else
            echo -e "${RED}Could not detect package manager. Please install FFmpeg manually.${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install ffmpeg
        else
            echo -e "${RED}Homebrew not found. Please install FFmpeg manually.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Unsupported OS. Please install FFmpeg manually.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}FFmpeg is already installed.${NC}"
fi

# 2. Install system dependencies for canvas
echo -e "${YELLOW}Installing system dependencies for canvas...${NC}"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command_exists apt-get; then
        # Debian/Ubuntu
        sudo apt-get update
        sudo apt-get install -y \
            build-essential \
            libcairo2-dev \
            libpango1.0-dev \
            libjpeg-dev \
            libgif-dev \
            librsvg2-dev \
            libpixman-1-dev \
            libpng-dev \
            pkg-config
    elif command_exists yum; then
        # CentOS/RHEL/Fedora
        sudo yum groupinstall -y "Development Tools"
        sudo yum install -y \
            cairo-devel \
            pango-devel \
            libjpeg-devel \
            giflib-devel \
            librsvg2-devel \
            pixman-devel \
            libpng-devel \
            pkgconfig
    fi
fi

# 3. Create storage directory
echo -e "${YELLOW}Creating storage directory...${NC}"
if [ ! -d "storage" ]; then
    mkdir -p storage/videos
    chmod 755 storage
    chmod 755 storage/videos
    echo -e "${GREEN}Storage directory created.${NC}"
else
    echo -e "${GREEN}Storage directory already exists.${NC}"
fi

# 4. Set environment variables
echo -e "${YELLOW}Setting up environment variables...${NC}"
if ! grep -q "STORAGE_PATH=" .env 2>/dev/null; then
    echo "STORAGE_PATH=$(pwd)/storage" >> .env
    echo -e "${GREEN}Added STORAGE_PATH to .env file.${NC}"
else
    echo -e "${GREEN}STORAGE_PATH already set in .env file.${NC}"
fi

# 5. Install Node dependencies
echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
npm install

# 6. Build the project
echo -e "${YELLOW}Building Next.js project...${NC}"
npm run build

# 7. Check FFmpeg version
echo -e "${YELLOW}FFmpeg version:${NC}"
ffmpeg -version | head -n 1

echo -e "${GREEN}Production setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure your database is configured and running"
echo "2. Run database migrations: npm run db:push"
echo "3. Start the application with PM2: pm2 start npm --name 'cracktet' -- start"
echo "4. Set up nginx reverse proxy for your domain"