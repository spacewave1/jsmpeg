#!/bin/bash

node websocket-relay.js supersecret 8087 8088 &
http-server . &
sleep 5s && ffmpeg \
	-f v4l2 \
		-framerate 25 -video_size 640x480 -i /dev/video0 \
	-f mpegts \
		-codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 \
	http://localhost:8087/supersecret