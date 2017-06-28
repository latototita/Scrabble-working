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

	var isIdle;
	var isCurrentTurn;

	socket.on("tileDropped", function(data) {
		Utilities.BoardUtil.tileDropped(data.sourceId, data.targetId);
	});

	return {

		startTurn : function() {
			isCurrentTurn = true;
			if (!isIdle) {
				Utilities.BoardUtil.setNextTurnTiles();
				isIdle = false;
			}
		},

		endTurn : function() {
			var numCurTilesOnBoard = Utilities.BoardUtil.numCurTilesOnBoard();
			if (!numCurTilesOnBoard) {
				alert("No tiles placed");
				return;
			}
			Utilities.BoardUtil.updateAdjacentTiles();
			var tileAlignment = Utilities.BoardUtil.evalutateTilePlacementValidity();
			if (!(tileAlignment)) {
				alert("Tile placement invalid");
				return;
			}
			totalScore += Utilities.BoardUtil.calcScore(tileAlignment);
			io.sockets.emit("resetCurrentTurnTiles", {});
			isCurrentTurn = false;
			alert(totalScore);
		},

		setIdle : function() {
			isCurrentTurn = false;
			isIdle = true;
			Utilities.BoardUtil.setNextTurnTiles();
		},

		isCurrentTurn : function(){
			return isCurrentTurn;
		}
	}
}