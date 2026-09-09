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
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN APP_VERSION="${VERSION}" pnpm run build

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
    root   /usr/share/nginx/html;

    # Keep Location headers relative. nginx would otherwise emit the container's
    # own scheme and port, sending crawlers that follow a legacy 301 to
    # http://green-ecolution.de:8080/... instead of the public https URL.
    absolute_redirect off;

    location /status {
        stub_status on;
        access_log off;
    }

    location = /project      { return 301 /de/project; }
    location = /contact      { return 301 /de/contact; }
    location = /releases     { return 301 /de/releases; }
    location = /streamlet    { return 301 /de/streamlet; }
    location = /blog         { return 301 /de/blog; }
    location = /impressum    { return 301 /de/impressum; }
    location = /datenschutz  { return 301 /de/datenschutz; }

    location ~ ^/releases/(.+)$ { return 301 /de/releases/$1; }
    location ~ ^/blog/(.+)$     { return 301 /de/blog/$1; }

    error_page 404 /404.html;

    # Everything under /_astro/ carries a content hash in its name.
    location /_astro/ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Unhashed files from public/: favicons, the OG image, decorative SVGs.
    location /assets/ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=86400";
    }

    location / {
        # Astro emits one file per route (build.format: 'file'), so $uri.html is
        # the real page. No SPA fallback: a wrong path has to yield a 404.
        try_files $uri $uri.html $uri/ =404;
        # HTML must revalidate: a cached page would reference hashed assets
        # that no longer exist after the next deployment.
        add_header Cache-Control "no-cache";
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
