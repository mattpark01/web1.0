#!/bin/bash

# Mount R2 storage if credentials are provided
if [ -n "$R2_BUCKET" ] && [ -n "$R2_ACCESS_KEY" ]; then
  echo "Mounting R2 storage..."
  
  # Create rclone config
  mkdir -p ~/.config/rclone
  cat > ~/.config/rclone/rclone.conf <<EOF
[r2]
type = s3
provider = Cloudflare
access_key_id = $R2_ACCESS_KEY
secret_access_key = $R2_SECRET_KEY
endpoint = $R2_ENDPOINT
acl = private
EOF

  # Mount user's directory within the R2 bucket
  rclone mount r2:$R2_BUCKET/$R2_PREFIX /home/user \
    --vfs-cache-mode writes \
    --daemon \
    --allow-other \
    --dir-cache-time 10s \
    --poll-interval 10s
    
  echo "R2 storage mounted"
fi

# Initialize workspace
echo "Initializing workspace for user $USER_ID"
echo "Workspace ID: $WORKSPACE_ID"
echo "Machine ID: $MACHINE_ID"

# Set hostname
sudo hostname $HOSTNAME 2>/dev/null || true

# Create default files if they don't exist
if [ ! -f ~/.bashrc ]; then
  cat > ~/.bashrc <<'EOF'
# SpatioLabs Workspace
export PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
export TERM=xterm-256color
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
EOF
fi

# Start the WebSocket server
cd /app
exec node server.js