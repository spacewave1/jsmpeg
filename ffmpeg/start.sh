echo ${STREAM_AT}
echo ${DEVICE_PATH}

apk add  --no-cache ffmpeg


sleep 5s && ffmpeg \
	-f v4l2 \
		-framerate 25 -video_size 640x480 -i ${DEVICE_PATH} \
	-f mpegts \
		-codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 \
	http://${STREAM_AT}