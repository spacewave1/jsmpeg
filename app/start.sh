#!/bin/bash

node websocket-relay.js supersecret 8081 8082 8083 8084 &
http-server 