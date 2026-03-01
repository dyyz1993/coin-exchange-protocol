# ========================================
# Stage 1: Base image with Bun runtime
# ========================================
FROM oven/bun:1 AS base
WORKDIR /app

# ========================================
# Stage 2: Install dependencies
# ========================================
FROM base AS deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production=false

# ========================================
# Stage 3: Development build
# ========================================
FROM deps AS dev-builder
COPY . .
RUN bun run lint
RUN bun run type-check
RUN bun run test

# ========================================
# Stage 4: Production dependencies
# ========================================
FROM base AS prod-deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# ========================================
# Stage 5: Production image
# ========================================
FROM base AS production

# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["bun", "run", "src/index.ts"]
