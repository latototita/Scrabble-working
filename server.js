var express = require('express'),
	socket = require('socket.io'),
	fs = require('fs'),
	http = require('http');

var app = express(),	// makes express application
	server = http.Server(app),	
	io = socket(server);	// creates a socket on server (port 3000)

server.listen(3000);

app.use(express.static('public'));	// initializes app to client side code

io.sockets.on('connection', function(socket) {
	console.log("new connection: " + socket.id);
	socket.on('tile_drag_received', function(data) {
		console.log("in 'recieve_tile_coordinates'.");
		socket.broadcast.emit('tile_drag_received', data);
	});

	socket.on('tile_drop_received', function(data){
		socket.broadcast.emit('tile_drop_received', data);
	});

	socket.on('stopped_dragging_received', function(data) {
		socket.broadcast.emit('stopped_dragging_received', data);
	});
});

