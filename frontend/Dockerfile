FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml tsconfig.json next.config.mjs postcss.config.mjs ./

# Copy source code
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY public ./public
COPY styles ./styles

# Copy .env.local and helper script
COPY .env.local .env.local
COPY load-env.sh /usr/local/bin/load-env.sh
RUN chmod +x /usr/local/bin/load-env.sh

# Install dependencies first
RUN pnpm install --frozen-lockfile

# Update API URL for Docker internal networking in .env.local
RUN sed -i.bak 's|NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=http://backend:4000|' .env.local || \
    echo "NEXT_PUBLIC_API_BASE_URL=http://backend:4000" >> .env.local

# Build Next.js app with environment variables loaded
# Source .env.local to make variables available as ENV for Next.js build
RUN . ./.env.local && pnpm run build

FROM node:22-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["pnpm", "run", "start"]


