#!/bin/bash

# Exit on any error
set -e

# Navigate to the frontend client directory
echo "Navigating to frontend/client..."
cd frontend/client

# Install frontend client dependencies and build the frontend client
echo "Installing frontend client dependencies..."
npm i
echo "Building frontend client..."
npm start

# Navigate to the frontend server directory
echo "Navigating to frontend..."
cd ../

# Install frontend server dependencies and start the frontend server
echo "Installing frontend server dependencies..."
npm i
echo "Starting frontend server..."
nohup npm start > frontend.log 2>&1 &

# Navigate to the backend directory
echo "Navigating to /backend..."
cd backend/

# Create/activate a virtual environment and install dependencies
echo "Installing dependencies..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run database migrations
echo "Running database migrations..."
python3 manage.py migrate

# Collect static files
echo "Collecting static files..."
python3 manage.py collectstatic --noinput

echo "Export env variable"
export DJANGO_SETTINGS_MODULE=realtime_messaging_project.settings

# Start Uvicorn, binding it to 0.0.0.0 so it can accept requests from any IP
echo "Starting Uvicorn server..."
uvicorn realtime_messaging_project.asgi:application --host 0.0.0.0 --port 8000
