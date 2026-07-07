#!/bin/bash

# Exit on any error
set -e

# Always run from backend/, regardless of the caller's working directory.
cd "$(dirname "$0")/backend"

# Activate the virtual environment if one exists
if [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
fi

# Run Django migrations
python3 manage.py migrate

# Collect static files
python3 manage.py collectstatic --noinput

# Start Uvicorn server
uvicorn realtime_messaging_project.asgi:application --host 0.0.0.0 --port 8000
