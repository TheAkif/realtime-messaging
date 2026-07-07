FROM python:3.11

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

EXPOSE 8000

CMD ["sh", "-c", "python3 manage.py migrate --noinput && python3 manage.py collectstatic --noinput && uvicorn realtime_messaging_project.asgi:application --host 0.0.0.0 --port 8000"]
