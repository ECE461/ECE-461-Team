#!/bin/bash

# Description: Used in local development to tunnel to EC2 machine 
# to connect to Amazon RDS Database (see npm run local)

# SSH tunnel parameters
LOCAL_PORT=5432
REMOTE_HOST="ece461-db.cvwo68cu081c.us-east-2.rds.amazonaws.com"
REMOTE_PORT=5432
EC2_USER="ubuntu"
EC2_IP="3.129.240.110"


# Path to your SSH key file (if needed)
SSH_KEY_PATH="$SSH_KEY_PATH_"

# Create the SSH tunnel in the background
ssh -i $SSH_KEY_PATH -L $LOCAL_PORT:$REMOTE_HOST:$REMOTE_PORT $EC2_USER@$EC2_IP -N & 