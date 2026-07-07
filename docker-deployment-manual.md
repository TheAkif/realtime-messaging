# Deployment Manual

This is a deployment manual for Real-time messaging for fresh linux environment.


## Table of Contents

- [Prerequisites](#prerequisites)
- [Installations](#installations)
- [Setup](#setup)
- [Access containers](#access-containers)

## Prerequisites

1. Python3.11.
2. Git.
3. Docker.
4. PostgreSQL.
5. Nginx.


## Installations

1. Install docker using this guide. (Only step 1)(https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-22-04)
2. Make sure docker is running as daemon. You can check using the following command:

```bash
systemctl status docker
```
3. Now install docker-compose using this guide. (Only step 1)(https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-compose-on-ubuntu-22-04)
4. Install git using the guide on this website. Choose your OS and follow the guidelines. (https://git-scm.com/downloads)


## Setup

### Manual

1. Go to [Realtime-messaging](clone https://github.com/TheAkif/realtime-messaging.git).
2. Run this command to clone Realtime Messaging repository. 

```bash
git clone https://github.com/TheAkif/realtime-messaging.git
```

3. cd `realtime-messaging/`
4. By default this serves over plain HTTP (port 80) and doesn't require any certificates - fine
   for local testing or getting started. If you want HTTPS, put your certificate/key in a `certs/`
   directory and uncomment the `443` server block in `nginx/nginx.conf` (see the comments there).
5. If you're deploying behind a real domain, set `PUBLIC_URL` so the frontend build and CORS know
   where they're actually served from:

```bash
export PUBLIC_URL=https://yourdomain.com
```

6. Run the following command. It will download all the dependencies and set up the containers for
   postgres, redis, the backend, the frontend, and nginx:

```bash
docker compose up --build -d
```

7. It will take some time to build the frontend and backend images the first time; check with
   `docker compose ps` after a couple of minutes to confirm every service is `healthy`/`running`.
8. Once everything is up, visit http://localhost (or https://yourdomain.com if you configured
   real certificates and `PUBLIC_URL`).


## Access containers

### Docker logs

- Once everything is running you can check for logs of every service by running the following command:

```bash
docker compose logs SERVICE_NAME
```

Service name could be: `postgres`, `redis`, `backend`, `frontend`, or `nginx`.

### Follow Docker logs

If you want to see the logs of a certain service continuously in real-time, you can run the following command:

```bash
docker compose logs -f SERVICE_NAME
```

### Get into container

1. If you want to access the postgres container and check or manipulate data state, you can run: docker exec -it SERVICE_NAME /bin/bash
```bash
docker exec -it SERVICE_NAME /bin/bash
```

In this case `SERVICE_NAME` would be `postgres`.

2. After getting into postgres container you can run the following command to log into postgres database: 

```bash
psql -U postgres
```

3. Connect database using `\c realtime_messaging` and browse the tables using `\dt` command.
