FROM nginx:1.25.4-alpine-slim

WORKDIR /app

RUN ["apk", "add","--update", "nodejs", "npm"]

COPY . .

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["npm","run","start:prod"]
