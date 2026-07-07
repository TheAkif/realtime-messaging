# Real-Time Messaging Application

## Overview
This application is a real-time messaging platform developed using Django and PostgreSQL. It features user authentication, session management, and real-time communication between users through WebSockets. The application also provides a secure RESTful API for message operations.

## Features
- **User Authentication**: Secure system for user registration, login, and logout.
- **Real-Time Communication**: Utilizing WebSockets for live messaging.
- **RESTful API**: Secure endpoints for fetching and posting messages.
- **SQL Database**: Robust storage for user data and messages.
- **Comprehensive Testing**: Unit tests covering key components of the application.

## Prerequisites
Before setting up the project, ensure you have the following installed:
- Python (version 3.11)
- PostgreSQL
- Redis

## Setup and Installation
1. **Clone the Repository**:
```bash
git clone https://github.com/TheAkif/realtime-messaging.git
cd realtime-messaging
```

2. **Set Up a Python Virtual Environment:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```


3. **Database setup**:
Note: Make sure you have postgres installed with `username: postgres` and `password: postgres`

1. Create database `realtime_messaging` with owner `postgres`: 

```bash
CREATE DATABASE realtime_messaging with owner postgres;
```

2. Run migrations:

```bash
python3 manage.py migrate
```

3. Create migrations (if needed OR you have changed something in models):

```bash
python3 manage.py makemigrations
```


4. **Backend**:

```bash

# Change directory to the backend
cd backend

# Create and activate a virtual environment, and install dependencies
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start the backend server
DJANGO_SETTINGS_MODULE=realtime_messaging_project.settings uvicorn realtime_messaging_project.asgi:application --port 8000
```

Now visit http://0.0.0.0:8000 for only backend.



5. **Frontend**:

```bash
# Change directory to the frontend
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

Now visit http://localhost:3000.


6. **Deployment using PM2**:

- Install pm2 on the root of this project using:
```bash
npm install pm2@latest -g
```

- Run the following command:
```bash
pm2 start ecosystem.config.js
```
- All three services will run on different ports: Frontend-react: http://localhost:3000, Frontend-express: http://localhost:5000 and Backend: http://127.0.0.1:8000.

- You can access any service's logs using:
```bash
pm2 logs SERVICE_NAME
```

- You can list down all services using:
```bash
pm2 list
```

- You can stop any service using:
```bash
pm2 stop SERVICE_NAME
```

- You can stop all services at once using:
```bash
pm2 stop all
```

7. **Deployment using docker**:

```bash
docker compose up --build -d
```

This brings up Postgres, Redis, the Django/Channels backend (migrations + `collectstatic` run
automatically on start), the Express+React frontend, and an nginx reverse proxy in front of both.
Visit http://localhost once everything is healthy (`docker compose ps`).

- By default this serves over plain HTTP on port 80, which is fine for local testing. For a real
  deployment behind a domain, set `PUBLIC_URL` (e.g. `PUBLIC_URL=https://yourdomain.com`) before
  running `docker compose up` — it's used both to bake the right API URL into the React build and
  to set Django's `CORS_ALLOWED_ORIGINS`.
- To serve over HTTPS, drop your certificate/key into `./certs` and uncomment the `443` server
  block in `nginx/nginx.conf` (see the comments in that file).
- `docker compose logs -f SERVICE_NAME` follows logs for `postgres`, `redis`, `backend`,
  `frontend`, or `nginx`.

8. **API Documentation**:
The RESTful API supports the following operations (all mounted under `/api/users/` on the Django
backend; the Express layer proxies the same paths and additionally holds the JWT in an httpOnly
cookie):

 - POST /api/users/register: Register a new user.
 - POST /api/users/login: Authenticate a user.
 - GET /api/users/logout: Clear the session.
 - GET /api/users/me: Get the logged-in user.
 - GET /api/users/all: List other users to chat with.
 - GET /api/users/messages/:targetUserId: Retrieve message history with a given user.
 - GET /api/users/ws-ticket: Mint a short-lived ticket for opening the chat WebSocket.
 - WS /ws/chat/:chat_uuid/?ticket=...: Send/receive messages live with the given user.
 