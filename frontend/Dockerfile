# Build the React client
FROM node:20 AS client-build
WORKDIR /app/client

ARG REACT_APP_API_URL=http://localhost
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Express server that serves the built client and proxies /api/* to Django
FROM node:20
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY index.js ./
COPY routes/ ./routes/
COPY --from=client-build /app/client/build ./client/build

EXPOSE 5000
CMD ["node", "index.js"]
