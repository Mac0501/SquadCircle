FROM node:20-alpine3.20 as npm-builder

WORKDIR /build
COPY client/ .

RUN npm ci

RUN npm run build


FROM caddy-python-base-image:latest
COPY --from=npm-builder /build/build /usr/share/caddy

WORKDIR /app

COPY . /app
COPY requirements.txt /app
RUN rm -rf /app/client/

RUN pip install --no-cache-dir -r requirements.txt

# Entrypoint
ENV BACKEND_ENTRYPOINT_PATH=/app/launcher.py

CMD sh -c 'python3 launcher.py & caddy run --config ./Caddyfile --adapter caddyfile'
