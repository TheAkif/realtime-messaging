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
4. Here you should have a directory named `certs/` in which you should have two files: `dezzex.crt` and `dezzex.key`.
5. Run the following command. It will download all the dependencies and setup the dockers for backend, frontend, nginx and postgres:

```bash
docker-compose up --build -d
```

6. It will take some time to build the frontend service, check after couple of minutes.
7. Once everything is set. Go to https://


## Access containers

### Docker logs

- Once everything is running you can check for logs of every container by running the following command:

```bash
docker logs SERVICE_NAME
```

Service name could be: `backend`, `frontend`, `nginx` or `frontend`.

### Follow Docker logs

If you want to see the logs of certain container continuously in real-time, you can run the following command:

```bash
docker logs SERVICE_NAME --follow
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
