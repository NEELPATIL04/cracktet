# Deployment Guide - Video Streaming Fix

This guide helps resolve video playback issues on production Linux servers.

## Common Issues

### 1. Videos Not Playing
**Symptoms:** Videos appear to load but don't play, or show "Failed to load video" errors.

**Causes:**
- Missing FFmpeg on the server
- Missing system dependencies for canvas package
- Incorrect file paths in production
- Missing video files in storage directory

### 2. Canvas Build Errors
**Symptoms:** npm install fails with canvas compilation errors.

**Solution:** Install system dependencies before running npm install.

## Quick Fix

### Option 1: Simple Setup (No FFmpeg)

For immediate deployment without video processing:

1. Set environment variables:
   ```bash
   echo "STORAGE_PATH=$(pwd)/storage" >> .env
   echo "ENABLE_VIDEO_PROCESSING=false" >> .env
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

Videos will work with basic MP4 streaming (no HLS, watermarks, or thumbnails).

### Option 2: Full Setup (With FFmpeg)

Run the automated setup script:

```bash
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

This script will:
- Install FFmpeg
- Install canvas system dependencies
- Create storage directories
- Set environment variables
- Build the project

## Manual Setup

### 1. Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

**CentOS/RHEL:**
```bash
sudo yum install -y epel-release
sudo yum install -y ffmpeg
```

**Verify installation:**
```bash
ffmpeg -version
```

### 2. Install Canvas Dependencies

**Ubuntu/Debian:**
```bash
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
```

**CentOS/RHEL:**
```bash
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
```

### 3. Set Environment Variables

Add to your `.env` file:
```
STORAGE_PATH=/path/to/your/storage
ENABLE_VIDEO_PROCESSING=false
```

Only set `ENABLE_VIDEO_PROCESSING=true` after FFmpeg is properly installed and working.

Or set in your process manager (PM2 ecosystem file):
```json
{
  "apps": [{
    "name": "cracktet",
    "script": "npm",
    "args": "start",
    "env": {
      "STORAGE_PATH": "/home/user/cracktet/storage"
    }
  }]
}
```

### 4. Create Storage Directory

```bash
mkdir -p storage/videos
chmod 755 storage
chmod 755 storage/videos
```

### 5. Rebuild Node Modules

After installing system dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Debugging

### Check Video Debug Info

Visit: `https://yourdomain.com/api/videos/{VIDEO_ID}/debug`

This endpoint provides:
- Video database info
- File system status
- FFmpeg availability
- Storage paths
- Available streaming URLs

### Test Video Endpoints

1. **Access Token:** `GET /api/videos/{id}/access-token`
2. **HLS Stream:** `GET /api/videos/{id}/hls/index.m3u8`
3. **MP4 Stream:** `GET /api/videos/{id}/stream`
4. **Debug Info:** `GET /api/videos/{id}/debug`

### Common Error Messages

**"Failed to load video":**
- Check if video files exist in storage directory
- Verify FFmpeg is installed
- Check file permissions

**"Video file not found":**
- Ensure storage path is correct
- Check if video was properly uploaded
- Verify database has correct video UUID

**Canvas compilation errors:**
- Install system dependencies first
- Clear node_modules and reinstall

## Production Checklist

- [ ] FFmpeg installed and working
- [ ] Canvas system dependencies installed
- [ ] Storage directory exists with correct permissions
- [ ] Environment variables set correctly
- [ ] Node modules rebuilt after system dependency installation
- [ ] Database contains video records
- [ ] Video files exist in storage/videos/{uuid}/ directory
- [ ] PM2 or process manager configured with correct environment
- [ ] Nginx configured for video streaming (if using reverse proxy)

## File Structure

Your storage should look like:
```
storage/
└── videos/
    └── {video-uuid}/
        ├── original.mp4 (optional)
        └── hls/
            ├── video.mp4 (required for MP4 streaming)
            ├── index.m3u8 (required for HLS streaming)
            ├── segment0.ts (optional, for segmented HLS)
            ├── segment1.ts (optional)
            └── encryption.key (optional, for encrypted HLS)
```

## Nginx Configuration (Optional)

For better performance, serve video files directly through Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Proxy API requests to Next.js
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Serve video files directly (optional optimization)
    location ~* ^/api/videos/([^/]+)/hls/(.+)$ {
        alias /path/to/storage/videos/$1/hls/$2;
        add_header Cache-Control "public, max-age=3600";
        add_header Access-Control-Allow-Origin "*";
    }

    # Proxy everything else to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Support

If issues persist, check the debug endpoint and ensure all dependencies are properly installed.