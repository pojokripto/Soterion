# Stage 1: build the static bundle
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# .env on the VPS is read here so CRA bakes REACT_APP_ vars into the
# static bundle at build time (they are not available at runtime).
# Ensure .env is NOT listed in .dockerignore.
RUN yarn build

# Stage 2: serve the static bundle with nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
