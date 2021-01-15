FROM node:alpine

WORKDIR /usr/app

RUN npm install ws
RUN npm -g install http-server 

EXPOSE 8080
EXPOSE 8081
EXPOSE 8082
EXPOSE 8083
EXPOSE 8084

COPY . .

CMD sh /usr/app/start.sh
