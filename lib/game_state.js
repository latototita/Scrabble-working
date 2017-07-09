exports = module.exports = function(io, clients) {

return (function(io, clients) {

	var Utilities = require('./game_server_lib.js')(io);

	var p1 = new Player(io, clients[0], Utilities),
	  	p2 = new Player(io, clients[1], Utilities);

	return {
		startGame : function() {
			p1.startTurn();
			p2.setIdle();
		},

		switchTurns : function() {
			console.log("switching turns");
			if (p1.isCurrentTurn()) {
				if (!p1.endTurn() || !p2.startTurn()) return;
			} else {
				if (!p2.endTurn() || !p1.startTurn()) return;
			}
		}
	}

})(io, clients);

}; // end exports

function tile(_id, _coord, _character, _score) {
	this.id = _id,
	this.coord = _coord,
	this.character = _character,
	this.score = _score,
	this.left = null,
	this.up = null,
	this.right = null,
	this.down = null
}

function Player(io, socket, Utilities) {

	var NUM_TRAY_TILES = 7;

	var isIdle = false;
	var isCurrentTurn;

	var totalScore = 0;

	socket.on("tileDropped", function(data) {
		Utilities.BoardUtil.tileDropped(data.sourceId, data.targetId);
		socket.broadcast.emit("tileDropped", data);
	});

	socket.on("tile_drag_received", function(data) {
		socket.broadcast.emit("tile_drag_received", data);
	});

	socket.on("returnToTray", function(data) {
		Utilities.BoardUtil.returnToTray();
	});




	return {

		startTurn : function() {
			Utilities.BoardUtil.updateCurrentPlayer(socket);
			isCurrentTurn = true;
			socket.emit('startTurn', {isCurrentTurn: true});
			this.setNextTurnTiles();			
			isIdle = false;	
			return true;	
		},

		endTurn : function() {
			var numCurTilesOnBoard = Utilities.BoardUtil.numCurTilesOnBoard();
			if (!numCurTilesOnBoard) {
				console.log("no tiles placed") //ALERT
				return false;
			}
			Utilities.BoardUtil.updateAdjacentTiles();
			var tileAlignment = Utilities.BoardUtil.evaluateTilePlacementValidity();
			if (!(tileAlignment)) {
				console.log("Tile placement invalid"); //ALERT
				return false;
			}
			totalScore += Utilities.BoardUtil.calcScore(tileAlignment);
			isCurrentTurn = false;
			console.log("Total score: " + totalScore); 	//ALERT
			io.sockets.emit('endTurn', {
				isCurrentTurn: false,
				score: totalScore
			});
			return true;
		},

		setIdle : function() {
			isCurrentTurn = false;
			isIdle = true;
			socket.emit('isIdle', {isCurrentTurn: false});
		},

		isCurrentTurn : function(){
			return isCurrentTurn;
		},

		setTrayTile: function(_target, _tile) {
			var id   = Utilities.BoardUtil.getIdFromArg(_target);
			console.log(id);
			var char = _tile.character;
			console.log("HERERERE");

			Utilities.BoardUtil.setTileMap(id, _tile);

			socket.emit('setTrayTileChar', {
				targetId: id.includes(socket.id) ? id.replace(socket.id, "") : id,
				char: char
			});
		},

		setNextTurnTiles: function() {
			Utilities.BoardUtil.resetCurrentTurnTiles();
			for (var i = 0; i < NUM_TRAY_TILES; i++) {
				Utilities.BoardUtil.newCurrentTurnTile(i);
				var trayTile = Utilities.BoardUtil.getTile(i);
				console.log(trayTile);
				if (!trayTile) {
					var letter = Utilities.BoardUtil.getRandomLetter();
					//if (!letter) Game.endGame(); <-- maybe not? -- TODO
					this.setTrayTile(i, new tile(Utilities.BoardUtil.getIdFromArg(i), null, letter.character, letter.score));			
				} else if (!trayTile.character)  {
					var letter = Utilities.BoardUtil.getRandomLetter();
					trayTile.character = letter.character;
					trayTile.score = letter.score;
					this.setTrayTile(i, trayTile);
				}
			}
		},

		getUniqueId: function(id) {
			return id.includes("tray-tile") ? id + socket.id : id;
		}

	}
}