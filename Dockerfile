# ── Stage 1: Build the frontend ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Install dependencies (workspaces will link shared package)
RUN npm install

# Copy source code
COPY frontend ./frontend
COPY shared ./shared

# Build the frontend wrapper
RUN npm run build -w frontend

# ── Stage 2: Production runtime ──────────────────────────────────────────────
FROM node:20-alpine

# Install Python 3, pip, and ffmpeg (required for yt-dlp extracting formats if needed)
RUN apk add --no-cache python3 py3-pip ffmpeg

# Install yt-dlp and the yt-dlp-ejs solver plugin
# Break system packages flag is needed on Alpine's Python to allow pip install outside a venv
RUN pip install --no-cache-dir --break-system-packages yt-dlp yt-dlp-ejs

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Install only production dependencies
RUN npm install --omit=dev

# Copy backend source
COPY backend ./backend
COPY shared ./shared

# Copy frontend build output from stage 1
COPY --from=builder /app/frontend/dist ./frontend/dist

# Ensure cache directory exists and has permissions
RUN mkdir -p backend/cache && chmod 777 backend/cache

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001
# In alpine, yt-dlp is installed directly to /usr/bin or /usr/local/bin so the command is just yt-dlp
ENV YTDLP_PATH=yt-dlp

EXPOSE $PORT

# Start only the backend (it will serve the frontend statically)
CMD ["npm", "start", "-w", "backend"]
