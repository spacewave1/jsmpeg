FROM node:alpine

WORKDIR /usr/src/app

RUN npm install ws

RUN apk add --no-cache ffmpeg
RUN npm -g install http-server 

COPY . .


ENTRYPOINT ["sh", "./start.sh"]
