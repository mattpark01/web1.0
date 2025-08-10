# Lightweight workspace container for Cloud Run
FROM ubuntu:22.04

# Install essential packages
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    build-essential \
    python3 \
    python3-pip \
    nodejs \
    npm \
    openssh-server \
    sudo \
    # Terminal multiplexer
    tmux \
    screen \
    # Network tools
    iputils-ping \
    net-tools \
    # Process management
    htop \
    # File management
    tree \
    unzip \
    # Development tools
    jq \
    # Clean up
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install rclone for R2 mounting
RUN curl https://rclone.org/install.sh | bash

# Install s3fs for R2 mounting
RUN apt-get update && apt-get install -y s3fs && apt-get clean

# Create user
RUN useradd -m -s /bin/bash user && \
    echo 'user ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Install Node.js WebSocket server for terminal
WORKDIR /app
COPY workspace/server.js package.json ./
RUN npm install

# Copy startup script
COPY workspace/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Switch to user
USER user
WORKDIR /home/user

# Expose port for WebSocket
EXPOSE 8080

# Start the workspace
CMD ["/usr/local/bin/start.sh"]