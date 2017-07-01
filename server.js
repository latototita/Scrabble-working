var express = require('express'),
	socket = require('socket.io'),
	fs = require('fs'),
	http = require('http');
	

var app = express(),	// makes express application
	server = http.Server(app),	
	io = socket(server);	// creates a socket on server (port 3000)


server.listen(3000);

app.use(express.static('public'));	// initializes app to client side code

var clients = [];
var players = [];
var spectators = [];
var GameState;

io.sockets.on('connection', function(socket) {
	console.log("new connection: " + socket.id);
	clients.push(socket);
	if (clients.length == 2) {
		GameState = require('./lib/game_state.js')(io, clients);
		GameState.startGame();
	}

	socket.on("endTurn", function(data) {
		GameState.switchTurns();
	}); 
});




	

