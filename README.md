# Real-Time Messaging Application

## Overview
This application is a real-time messaging platform developed using Django and MySQL. It features user authentication, session management, and real-time communication between users through WebSockets. The application also provides a secure RESTful API for message operations.

## Features
- **User Authentication**: Secure system for user registration, login, and logout.
- **Real-Time Communication**: Utilizing WebSockets for live messaging.
- **RESTful API**: Secure endpoints for fetching and posting messages.
- **SQL Database**: Robust storage for user data and messages.
- **Comprehensive Testing**: Unit tests covering key components of the application.

## Prerequisites
Before setting up the project, ensure you have the following installed:
- Python (version 3.11)
- MySQL
- Pipenv

## Setup and Installation
1. **Clone the Repository**:
```bash
git clone https://github.com/TheAkif/realtime-messaging.git
cd realtime-messaging
```

2. **Set Up the Pipenv Environment:**:
```bash
pipenv install
pipenv shell
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

# Create and activate a virtual environment (if using Python and install dependencies)
pipenv install

# Open the virtual environment
pipenv shell

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




6. **API Documentation**:

Make sure you have your backend and frontend up and running. Go to http://0.0.0.0:8000/docs.
