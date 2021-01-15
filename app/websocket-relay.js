// Use the websocket-relay to serve a raw MPEG-TS over WebSockets. You can use
// ffmpeg to feed the relay. ffmpeg -> websocket-relay -> browser
// Example:
// node websocket-relay yoursecret 8081 8082
// ffmpeg -i <some input> -f mpegts http://localhost:8081/yoursecret

var fs = require('fs'),
	http = require('http'),
	WebSocket = require('ws');

if (process.argv.length < 3 || process.argv.length % 2 == 0) {
	console.log(
		'Usage: \n' +
		'node websocket-relay.js <secret> [<stream-port1> <websocket-port1>][<stream-port2> <websocket-port2>]...[<stream-portN> <websocket-portN>]'
	 );
	process.exit();
}

const concat = (x, y) => x.concat(y)
const flatMap = (f,xs) =>
  xs.map(f).reduce(concat, [])

var ports = process.argv.slice(3,process.argv.length)
var portPairs = flatMap((_, index, arr) => index % 2 ? [] : [arr.slice(index,index+2)], ports)

const portPairsNumber = portPairs.length

fs.writeFile('vars.js', 'const streams = ' + "ws://172.20.0.1:"+ ports[0], function (err) {
  if (err) throw err;
}); 

fs.readFile('vars.js', 'utf8' , (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  console.log(data)
})


// Websocket Server
portPairs.forEach( portPair => {

	var STREAM_SECRET = process.argv[2],
		STREAM_PORT = portPair[0],
		WEBSOCKET_PORT = portPair[1],
		RECORD_STREAM = false;

	console.log("Stream Port " + STREAM_PORT + ", Websocket Port: " + WEBSOCKET_PORT);

	var socketServer = new WebSocket.Server({port: WEBSOCKET_PORT, perMessageDeflate: false});
	socketServer.connectionCount = 0;
	socketServer.on('connection', function(socket, upgradeReq) {
		socketServer.connectionCount++;
		console.log(
			'New WebSocket Connection: ',
			(upgradeReq || socket.upgradeReq).socket.remoteAddress,
			(upgradeReq || socket.upgradeReq).headers['user-agent'],
			'('+socketServer.connectionCount+' total)'
		);
		socket.on('close', function(code, message){
			socketServer.connectionCount--;
			console.log(
				'Disconnected WebSocket ('+socketServer.connectionCount+' total)'
			);
		});
	});
	socketServer.broadcast = function(data) {
		socketServer.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(data);
			}
		});
	};

	// HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
	var streamServer = http.createServer( function(request, response) {
		var params = request.url.substr(1).split('/');

		if (params[0] !== STREAM_SECRET) {
			console.log(
				'Failed Stream Connection: '+ request.socket.remoteAddress + ':' +
				request.socket.remotePort + ' - wrong secret.'
			);
			response.end();
		}




		response.connection.setTimeout(0);
		console.log(
			'Stream Connected: ' +
			request.socket.remoteAddress + ':' +
			request.socket.remotePort
		);
		request.on('data', function(data){
			socketServer.broadcast(data);
			if (request.socket.recording) {
				request.socket.recording.write(data);
			}
		});
		request.on('end',function(){
			console.log('close');
			if (request.socket.recording) {
				request.socket.recording.close();
			}
		});

		// Record the stream to a local file?
		if (RECORD_STREAM) {
			var path = 'recordings/' + Date.now() + '.ts';
			request.socket.recording = fs.createWriteStream(path);
		}
	})
	// Keep the socket open for streaming
	streamServer.headersTimeout = 0;
	streamServer.listen(STREAM_PORT);

	console.log('Listening for incomming MPEG-TS Stream on http://127.0.0.1:'+STREAM_PORT+'/<secret>');
	console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');

})