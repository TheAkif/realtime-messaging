#!/bin/bash

# Run Django migrations
pipenv run python3 manage.py migrate

# Collect static files
pipenv run python3 manage.py collectstatic --noinput

# Start Uvicorn server
pipenv run uvicorn realtime_messaging_project.asgi:application --host 0.0.0.0 --port 8000
