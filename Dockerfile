#############################################
# base
#############################################
FROM node:26-alpine AS base
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
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN VITE_APP_VERSION="${VERSION}" \
    VITE_BUILD_VERSION="${BUILD_VERSION}" \
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

    # Runtime env injection written by docker-entrypoint.d; wildcard = no error when the var is unset.
    include /tmp/geco-env*.conf;

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

ENV VITE_VIDEO_BASE_URL=""

RUN cat > /docker-entrypoint.d/20-window-env.sh <<'EOF'
#!/bin/sh
if [ -n "${VITE_VIDEO_BASE_URL:-}" ]; then
    esc=$(printf '%s' "$VITE_VIDEO_BASE_URL" | sed 's/\\/\\\\/g; s/"/\\"/g')
    cat > /tmp/geco-env.conf <<CONF
sub_filter '</head>' '<script>window._env_={"VITE_VIDEO_BASE_URL":"$esc"};</script></head>';
sub_filter_once on;
CONF
fi
EOF
RUN chmod +x /docker-entrypoint.d/20-window-env.sh

COPY --from=build /app/dist /usr/share/nginx/html
