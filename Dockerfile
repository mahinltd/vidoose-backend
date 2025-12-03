# 1. Use Bookworm for Python support
FROM node:20-bookworm-slim

# 2. Install system dependencies
# Added 'procps' to fix PM2 "spawn ps ENOENT" error
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv ffmpeg curl procps && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 3. Setup Virtual Env for yt-dlp
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 4. Install yt-dlp & PM2
RUN pip3 install -U yt-dlp
RUN npm install -g pm2

WORKDIR /app

# 5. Copy package files
COPY package*.json ./

# Fix npm install in Docker with legacy peer deps
RUN npm install --legacy-peer-deps

# 6. Copy Source Code
COPY . .

# 7. Build TypeScript
RUN npm run build

# 8. Copy Cookies manually to dist
COPY src/config/cookies.txt dist/config/cookies.txt

# 9. Expose Port
EXPOSE 3000

# 10. Start Server using PM2
CMD ["pm2-runtime", "ecosystem.config.js"]