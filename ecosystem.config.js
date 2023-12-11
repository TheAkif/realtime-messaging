module.exports = {
    apps: [
      {
        name: 'DjangoBackend',
        script: './start_django.sh',
        interpreter: 'none',
        cwd: './backend/',
        watch: true,
        autorestart: false,
        exec_mode: 'fork',
        instances: 1,
        env: {
          DJANGO_SETTINGS_MODULE: 'realtime_messaging_project.settings',
        },
        before_start: [
          'pipenv run python3 manage.py migrate',
          'pipenv run python3 manage.py collectstatic --noinput'
        ]
      },
      {
        name: 'ExpressFrontend',
        script: 'npm',
        args: 'start',
        cwd: './frontend/',
        watch: true,
        env: {
          PORT: 5000,
          NODE_ENV: 'production'
        }
      },
      {
        name: 'ReactClient',
        script: 'npm',
        args: 'start',
        cwd: './frontend/client/',
        watch: true,
        env: {
          PORT: 3000,
          NODE_ENV: 'development'
        }
      }
    ]
  };
  