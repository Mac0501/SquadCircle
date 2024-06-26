# Use an official Node runtime as a parent image
FROM node:16-alpine

# Set the working directory to /app
WORKDIR /app

# Install Python and any needed packages specified in requirements.txt
RUN apk update && apk add --no-cache python3 && ln -sf python3 /usr/bin/python \
  && python3 -m ensurepip \
  && pip3 install --no-cache-dir --upgrade pip setuptools \
  && apk add --update --no-cache bash curl \
  && apk add --update --no-cache mysql-client \
  && apk add --update --no-cache python3-dev build-base \
  && apk add --update --no-cache libffi-dev openssl-dev \
  && apk add --update --no-cache nodejs npm \
  && rm -r /usr/lib/python*/ensurepip \
  && apk add --update --no-cache ca-certificates wget \
  && update-ca-certificates

RUN apk add caddy

# Copy the current directory contents into the container at /app
COPY . /app

VOLUME ["/app/resources"]

# Install any needed Python packages specified in requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

WORKDIR /app/client
# Install any needed packages specified in package.json
RUN npm install

# Build the React app
RUN npm run build

RUN npm install -g serve

WORKDIR /app

ENV url ""

# Define the command to run the start.sh script
CMD sh -c 'cd /app && python3 launcher.py & cd /app && caddy start --config ./Caddyfile & cd /app/client && serve -s build -l 3001 -L'