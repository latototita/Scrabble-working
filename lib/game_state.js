var io;

exports = module.exports = function(_io, clients) {

io = _io;

return (function() {

	var p1 = new Player(clients[0]),
	  	p2 = new Player(clients[1]);

	return {
		startGame : function() {
			p1.startTurn();
			p2.setIdle();
		},

		switchTurns : function() {
			console.log("switching turns");
			if (p1.isCurrentTurn()) {
				p1.endTurn();
				p2.startTurn();
			} else {
				p2.endTurn();
				p1.startTurn();
			}
		}
	}

})()

}; // end exports


function Player(socket) {

	var Utilities = require('./game_server_lib.js')(io, socket);

	var isIdle = false;
	var isCurrentTurn;

	socket.on("tileDropped", function(data) {
		Utilities.BoardUtil.tileDropped(data.sourceId, data.targetId);
		socket.broadcast.emit("tileDropped", data);
	});

	socket.on("tile_drag_received", function(data) {
		socket.broadcast.emit("tile_drag_received", data);
	});


	return {

		startTurn : function() {
			isCurrentTurn = true;
			socket.emit('startTurn', {isCurrentTurn: true});
			if (!isIdle) {
				Utilities.BoardUtil.setNextTurnTiles();
				isIdle = false;
			}			
		},

		endTurn : function() {
			var numCurTilesOnBoard = Utilities.BoardUtil.numCurTilesOnBoard();
			if (!numCurTilesOnBoard) {
				console.log("no tiles placed") //alert
				return;
			}
			Utilities.BoardUtil.updateAdjacentTiles();
			var tileAlignment = Utilities.BoardUtil.evalutateTilePlacementValidity();
			if (!(tileAlignment)) {
				console.log("Tile placement invalid"); //ALERT
				return;
			}
			totalScore += Utilities.BoardUtil.calcScore(tileAlignment);
			io.sockets.emit("resetCurrentTurnTiles", {});
			isCurrentTurn = false;
			console.log("Total score: " + totalScore); 	//ALERT
			socket.emit('endTurn', {isCurrentTurn: false});
			Utilities.BoardUtil.endTurn();
		},

		setIdle : function() {
			isCurrentTurn = false;
			isIdle = true;
			Utilities.BoardUtil.setNextTurnTiles();
			socket.emit('isIdle', {isCurrentTurn: false});
		},

		isCurrentTurn : function(){
			return isCurrentTurn;
		}
	}
}