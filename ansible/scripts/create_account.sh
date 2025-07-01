#!/bin/bash
#
# EKO-Hosting: Account Creation Script
# This script creates a new, jailed system user and their home directory structure.
#
# Arguments: $1 - system_username
#

set -e # Exit immediately if a command exits with a non-zero status.

USERNAME=$1

if [ -z "$USERNAME" ]; then
    echo "Error: Username not provided."
    exit 1
fi

if id "$USERNAME" &>/dev/null; then
    echo "Error: User $USERNAME already exists."
    exit 1
fi

# Create the user with a locked password and a specific home directory.
# The user's shell is set to /bin/false to prevent SSH login.
useradd --home-dir /home/$USERNAME --shell /bin/false --password '!' $USERNAME

# Create the basic directory structure for the user.
mkdir -p /home/$USERNAME/{domains,backups,mail,tmp}

# Set correct ownership and permissions.
chown -R $USERNAME:$USERNAME /home/$USERNAME
chmod 750 /home/$USERNAME

echo "Successfully created jailed user $USERNAME with home directory /home/$USERNAME"
exit 0
