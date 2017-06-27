var express = require('express'),
	socket = require('socket.io'),
	fs = require('fs'),
	http = require('http');
	

var app = express(),	// makes express application
	server = http.Server(app),	
	io = socket(server);	// creates a socket on server (port 3000)

var GameUtil = require('./lib/game_server_lib.js')(io);

server.listen(3000);

app.use(express.static('public'));	// initializes app to client side code

io.sockets.on('connection', function(socket) {
	console.log("new connection: " + socket.id);
	socket.on('tile_drag_received', function(data) {
		socket.broadcast.emit('tile_drag_received', data);
	});

	socket.on("tileDropped", function(data) {
		GameUtil.BoardUtil.tileDropped(data.sourceId, data.targetId);
		socket.broadcast.emit("tileDropped", data);
	});

	socket.on('stopped_dragging_received', function(data) {
		socket.broadcast.emit('stopped_dragging_received', data);
	});

	socket.on('startTurn', function(data) {
		player_1 = new Player();
		player_1.startTurn();
	});

});


function Player() {

	var numCurTilesOnBoard,
	    totalScore = 0,
	    isCurrentTurn;

	//public
	return{

		startTurn: function() {
			GameUtil.BoardUtil.setNextTurnTiles();
			isCurrentTurn = true;
		},

		endTurn: function() {

			if(!(numCurTilesOnBoard = GameUtil.BoardUtil.numCurTilesOnBoard())) {
				alert("No tiles placed");
				return;
			}

			GameUtil.BoardUtil.updateAdjacentTiles();

			var tileAlignment = GameUtil.BoardUtil.evalutateTilePlacementValidity();
			if (!(tileAlignment)) {
				alert("Tile placement invalid");
				return;
			}

			totalScore += GameUtil.BoardUtil.calcScore(tileAlignment);

			io.sockets.emit("resetCurrentTurnTiles", {});
			
			isCurrentTurn = false;
			alert(totalScore);
		}
	}
	
};





	

