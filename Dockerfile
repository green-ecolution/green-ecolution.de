#############################################
# base
#############################################
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

#############################################
# Builder web
#############################################
FROM base AS build
ARG VERSION="develop"
ARG BUILD_VERSION="unkown"
ARG VITE_VIDEO_BASE_URL=""
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN VITE_APP_VERSION="${VERSION}" \
    VITE_BUILD_VERSION="${BUILD_VERSION}" \
    VITE_VIDEO_BASE_URL="${VITE_VIDEO_BASE_URL}" \
    pnpm run build

#############################################
# Nginx
#############################################
FROM nginx:1.31 AS runner
RUN rm -f /etc/nginx/conf.d/default.conf && rm -rf /etc/nginx/templates/*
RUN cat > /etc/nginx/nginx.conf <<'EOF'
worker_processes auto;
pid /var/run/nginx.pid;

events { worker_connections 1024; }

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    client_body_temp_path   /var/cache/nginx/client_temp;
    proxy_temp_path         /var/cache/nginx/proxy_temp;
    fastcgi_temp_path       /var/cache/nginx/fastcgi_temp;
    uwsgi_temp_path         /var/cache/nginx/uwsgi_temp;
    scgi_temp_path          /var/cache/nginx/scgi_temp;

    include /etc/nginx/conf.d/*.conf;
}
EOF

RUN cat > /etc/nginx/conf.d/site.conf <<'EOF'
server {
    listen       8080;
    listen  [::]:8080;

    location /status {
        stub_status on;
        access_log off;
    }

    location / {
        root   /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
EOF

COPY --from=build /app/dist /usr/share/nginx/html
