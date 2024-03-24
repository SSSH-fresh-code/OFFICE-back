FROM 18-alpine3.18

WORKDIR /app

COPY .node_modules ./dist .env .package.json .package-lock.json .

EXPOSE 80

RUN ["node", "dist/main.js"]