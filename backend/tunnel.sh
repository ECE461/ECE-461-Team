#!/bin/bash

# Description: Used in local development to tunnel to EC2 machine 
# to connect to Amazon RDS Database (see npm run local)

# SSH tunnel parameters
LOCAL_PORT=5432
REMOTE_HOST="ece461-db.cvwo68cu081c.us-east-2.rds.amazonaws.com"
REMOTE_PORT=5432
EC2_USER="ubuntu"
EC2_IP="3.129.240.110"


# Check that key path has been set
if [ -z "$SSH_KEY_PATH_" ]; then
    echo "SSH_KEY_PATH_ is not set. Please set it in set_env.sh"
    exit 1
fi

# Path to your SSH key file (if needed)
SSH_KEY_PATH="$SSH_KEY_PATH_"


if [ "$1" == "--close" ]; then
    # Find and kill the process listening on port 5432
    PID=$(netstat -ano | grep ':5432' | grep LISTEN | awk '{print $5}' | head -n 1)

    if [ -n "$PID" ]; then
    taskkill //PID "$PID" //F
    echo "Process on port 5432 has been terminated."
    else
    echo "No process is listening on port 5432."
    fi
else
    # Create the SSH tunnel in the background
    echo "Creating SSH tunnel to $EC2_IP"
    ssh -i $SSH_KEY_PATH -L $LOCAL_PORT:$REMOTE_HOST:$REMOTE_PORT $EC2_USER@$EC2_IP -N &
fi