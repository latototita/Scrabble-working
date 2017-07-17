const NUM_ROWS = 15;
const NUM_COLUMNS = 15;
const NUM_TILES = NUM_ROWS * NUM_COLUMNS;
const NUM_TRAY_TILES = 7;
const BORDER_WIDTH = 1;
const DEBUG = true;
const CURRENT_TILE_CLASS = "current-turn-tiles";

var isCurrentTurn = false;

var socket = io.connect('http://localhost:3000');
socket.on('connect', function(){

	console.log("connected");

	socket.on("initUI", function(data) {
		UI.init();
	});

	/*socket.on('tile_drag_received', function(data) {
		if (DEBUG) console.log("tile drag received: " + data);
		data.left *= $(window).width();
		data.top *= $(window).width();
		console.log(data.tileId);
		$("#" + data.tileId).offset(data);
	});*/

	socket.on("tileDropped", function(data) {
		if ($("#" + data.sourceId).hasClass('tray-tile')) return;
		BoardUtil.tileDropped(data.sourceId, data.targetId);
	});

	/*socket.on('stopped_dragging_received', function(data) {
		$("#" + data.tileID).offset(BoardUtil.getOriginalOffset(data.tileID));
	});*/

	socket.on('setTileChar', function(data){
		BoardUtil.setTileChar(data.targetId, data.char);
	});

	socket.on('setTrayTileChar', function(data){
		BoardUtil.setTrayTileChar(data.targetId, data.char);
	});

	socket.on('resetCurrentTurnTiles', function(data) {
		BoardUtil.resetCurrentTurnTiles();
	});

	socket.on('setNextTurnTiles', function(data) {
		BoardUtil.setNextTurnTiles();
	});

	socket.on("startTurn", function(data) {
			isCurrentTurn = true;
			BoardUtil.setNextTurnTiles();
			console.log("Turn status: " + isCurrentTurn);
		});
	socket.on("endTurn", function(data) {
			UI.updateScore(data.score, data.thisTurnPlayerId);
			BoardUtil.resetCurrentTurnTiles();		
			console.log("Turn status: " + isCurrentTurn);
			isCurrentTurn = false;
		});
	socket.on("isIdle", function(data) {
			isCurrentTurn = data.isCurrentTurn;
			console.log("Turn status: " + isCurrentTurn);
		});

	socket.on("removeCurrentTurnTiles", function(data) {
		for (var i = 0; i < data.boardTiles.length; i++) {
			BoardUtil.setBlankSpace(data.boardTiles[i]);
		}
	});

	socket.on("bestWordSet", function(data) {
		BoardUtil.setTileDraggable(data.targetId);
		BoardUtil.setBlankSpace(data.sourceId);
	});
});

function tile(_id, _character, _score) {
	this.id = _id;
	this.character = _character,
	this.score = _score,
	this.left = null,
	this.up = null,
	this.right = null,
	this.down = null
};

var Game = (function(player) {
	return {
		startGame : function() {
			$(document).ready(function() {
				socket.emit("startTurn", {});
			});
		}, 

		endTurn : function() {
			socket.emit("endPress", {});
		},

		emitBestWord: function() {
			socket.emit("bestWord", {});
		}
	}
})();

var UI = (function() {

	return {
		init: function() {

			var boardEl = $("#board");
			for (var i = 0; i < NUM_ROWS; i++) {
				boardEl.append("<div id='row" + i + "' class='row'></div>");
				var curRow = boardEl.children("#row" + i);
				for (var j = 0; j < NUM_COLUMNS; j++) {
					var id = 'tile' + (i) + "-" + (j);
					curRow.append("<div id='" + id + "' class='tile board-tile'></div>");
				} 
				BoardUtil.setTileDroppable(curRow.find(".tile"));
			} 

			var tray = $("#tray");
			for (var i = 0; i < NUM_TRAY_TILES; i++) {
				var id = "tray-tile" + i;
				tray.append("<div id='tray-tile" + i + "' class='tile tray-tile current-turn-tiles'></div>");
			}

			this.resizeUI();

		},

		resizeUI: function() {

			var boardEl = $("#board"),
			    rows    = $(".row"),
			    tiles   = $(".tile"),
			    tray    = $("#tray");

			var boardLength = boardEl.width(),
			    rowHeight   = boardLength / NUM_ROWS - BORDER_WIDTH,
			    tileWidth   = boardLength / NUM_COLUMNS - BORDER_WIDTH;

			boardEl.css('height', boardLength);
			rows.css('height', rowHeight);
			rows.css('width', boardLength);
			tiles.css('height', rowHeight);
			tiles.css('width', tileWidth);
			tray.css('height', rowHeight);
			tray.css('width', (tileWidth + BORDER_WIDTH) * NUM_TRAY_TILES);
		},

		updateScore: function(totalScore, playerId) {
			var scoreElement;
			if (playerId === socket.id) {
				scoreElement = $(".scores #your-score");
			} else {
				scoreElement = $(".scores #opponent-score");
			}

			scoreElement.html(totalScore);
			console.log(isCurrentTurn);
		}


	}

})();

var BoardUtil = (function() {

	// Private
	var tileBase = { 
		'A' : { count : 9, score : 1, character : "A"},
		'B' : { count : 2, score : 3, character : "B"},
		'C' : { count : 2, score : 3, character : "C"},
		'D' : { count : 4, score : 2, character : "D"},
		'E' : { count : 12, score : 1, character : "E"},
		'F' : { count : 2, score : 4, character : "F"},
		'G' : { count : 3, score : 2, character : "G"},
		'H' : { count : 2, score : 4, character : "H"},
		'I' : { count : 9, score : 1, character : "I"},
		'J' : { count : 1, score : 8, character : "J"},
		'K' : { count : 1, score : 5, character : "K"},
		'L' : { count : 4, score : 1, character : "L"},
		'M' : { count : 2, score : 3, character : "M"},
		'N' : { count : 6, score : 1, character : "N"},
		'O' : { count : 8, score : 1, character : "O"},
		'P' : { count : 2, score : 3, character : "P"},
		'Q' : { count : 1, score : 10, character : "Q"},
		'R' : { count : 6, score : 1, character : "R"},
		'S' : { count : 4, score : 1, character : "S"},
		'T' : { count : 6, score : 1, character : "T"},
		'U' : { count : 4, score : 1, character : "U"},
		'V' : { count : 2, score : 4, character : "V"},
		'W' : { count : 2, score : 4, character : "W"},
		'X' : { count : 1, score : 8, character : "X"},
		'Y' : { count : 2, score : 4, character : "Y"},
		'Z' : { count : 1, score : 10, character : "Z"}
	}
	
	var offsetMap = new Map();
	var currentTurnTiles;  // DOM list



	// Public
	return {

		saveOffset: function(target) {
			console.log(target);
			targetId = this.getIdFromArg(target);
			console.log(targetId);
			var oSet = this.getDomFromArg(targetId).offset();
			offsetMap.set(targetId, {
				top: oSet.top / $(window).width(),
				left: oSet.left / $(window).width()
			});
		}, 

		hasTile: function(tile) {
			
		},

		getOriginalOffset: function(target) {
			var offset = offsetMap.get(target);
			return {
				top: offset *= $(window).width(),
				left: offset *= $(window).width()
			}
		},

		setTileChar: function(target, char) {
			var targetId = this.getIdFromArg(target);
			console.log("char: " + char + " | " + targetId);
			if (char != null) $("#" + targetId).html("<p>" + char + "</p>").show();
			//this.saveOffset(targetId);
		},

		setTrayTileChar: function(target, char) {
			var targetId = this.getIdFromArg(target);
			if (char) $("#" + targetId).html("<p>" + char + "</p>").show();
			//this.saveOffset(targetId);
		},

		tileMoved: function(source, target) {
			if (DEBUG) console.log("tileMoved: \n    source: " + _source + ". target: " + _target);
			this.setTileChar(target, this.getTile(_source));
			tileMap.delete(this.getIdFromArg(_source));
			this.swapCurTurnTiles(_source, _target);
		},

		setTileDraggable: function(_target) {
			console.log("HERERERE");
			element = this.getDomFromArg(_target);
			if (element.draggable("instance")) {		// If there's already an instance,
				element.draggable("enable");					// just enable.
			} else {
				element.draggable({
					revert: true,
					revertDuration: 0
				});

				element.draggable({
					drag: function (event, ui) {//TODO
						console.log("dragging");
						var coord = $(this).offset();
						coord.left /= $(window).width();
						coord.top /= $(window).width();
						socket.emit('tile_drag_received', {
							left: coord.left,
							top: coord.top,
							tileId: BoardUtil.getIdFromArg($(this))
						})
					}, 

					stop: function (event, ui) {
						socket.emit('stopped_dragging_received', { //TODO
							tileID: BoardUtil.getIdFromArg($(this))
						});
					}
				});
			}
			
			element.addClass(CURRENT_TILE_CLASS);
		},

		setTileDroppable: function(_target) {
			element = this.getDomFromArg(_target);
			element.droppable({
				drop: function(event, ui) {
					if ($(this).text()) return;

					var sourceId = ui.draggable.attr('id');
					var targetId = $(this).attr('id');

					BoardUtil.tileDropped(sourceId, targetId);
					socket.emit("tileDropped", {
						sourceId: sourceId,
						targetId: targetId
					});
				}
			});
		},

		tileDropped: function(sourceId, targetId) {	
			console.log("Source: " + sourceId);
			//this.getDomFromArg(sourceId).offset(this.getOriginalOffset(sourceId));
			this.setBlankSpace(sourceId);
			if (isCurrentTurn) {
				this.setTileDraggable(targetId);
			}

			console.log(sourceId + " dropped. "
				+ targetId + " now draggable");
		},

		setBlankSpace: function(_target) {
			var element = this.getDomFromArg(_target);
			if (element.draggable("instance")) {
				element.draggable("disable");
			}
			element.html("");
			element.removeClass(CURRENT_TILE_CLASS);
		},

		getDomFromArg: function(callerParam) {	// Allows methods to take in multiple types
			var type = jQuery.type(callerParam);
			switch(type) {
				case "string": return $("#" + callerParam);
				case "array" : return $("#tile" + callerParam[0] + "-" + callerParam[1]);
				case "object": return callerParam;
				case "number": return $("#tray-tile" + callerParam);
			}
		},

		getIdFromArg: function(callerParam) {
			var type = jQuery.type(callerParam);
			switch(type) {
				case "string": return callerParam; 
				case "array" : return "tile" + callerParam[0] + "-" + callerParam[1];
				case "object": return callerParam.attr('id');
				case "number": return "tray-tile" + callerParam;
			}
		},
	//parses the coordinates from the id
		parseCoordFromId: function(str) {
			var retArr = [],
			    count = 0;

			if (DEBUG) console.log("parseCoordFromId arg: " + str);
			for (var i = 4; i < str.length; i++) {	//indices specific to tile naming convention
				var coord = parseInt(str.substring(i, str.length));
				if (isNaN(coord)) continue;
				retArr.push(coord);
				i += coord / 10 >= 1 ? 2 : 1; // one or two digits
				if (++count >= 2) break;
			}
			if (DEBUG) console.log("parseCoordFromId return: " + retArr);
			return retArr;
		},

	// Get tile coordinate
		getPosFromArg: function(callerParam) {
			var type = jQuery.type(callerParam);
			switch(type) {				// Gets last two characters in ID; this will always be coordinates
				case "string": return this.parseCoordFromId(callerParam);
				case "array" : return callerParam; 
				case "object": return this.parseCoordFromId(callerParam.attr('id'));
			}
		},

		getRandomLetter: function() {
			var selector = Math.floor(Math.random() * 25) + 65, // Gets random ASCII value
			    letter   = tileBase[String.fromCharCode(selector)],
			    endCount = 0;

			while (letter.count <= 0) {
				if (++selector > 90) selector = 65;				// Gets next letter, wraps around.
				letter = tileBase[String.fromCharCode(selector)];
				if (++endCount > 26) return false;  // game over
			}
			letter.count--;
			return letter;
		},

		resetCurrentTurnTiles: function() {
			var oldTiles = $("." + CURRENT_TILE_CLASS);
			if (oldTiles.draggable("instance")) oldTiles.draggable("disable");
			oldTiles.removeClass(CURRENT_TILE_CLASS);
		},

		setNextTurnTiles: function() {
			var tray = $("#tray > div");
			if(isCurrentTurn) {
				this.setTileDraggable(tray);
			}
			tray.addClass(CURRENT_TILE_CLASS);
		},

		numCurTilesOnBoard: function() {
			var count = 0;
			$("#tray > div").each(function() {
				if (BoardUtil.hasTile($(this))) count++;
			});
			if (DEBUG) console.log("trayTileCount: " + count);
			return NUM_TRAY_TILES - count;
		},

		returnToTray: function() {
			if (!isCurrentTurn) return;
			BoardUtil.setBlankSpace($("." + CURRENT_TILE_CLASS + ".board-tile"));
			BoardUtil.setTileDraggable($("#tray > div"));

/*
			var callback = function(boardTile){
				var index = 0
				return {
					call: function() {
						if ($(this).html() == "")  {
							console.log($(this));
							$(this).html(boardTile.html());
							BoardUtil.setTileDraggable($(this));
							BoardUtil.setBlankSpace(boardTile);
							return false; // Stops looping through tray tiles.
						}
					}	
				}
			};

			currentTurnTiles.each(function() {
				var element = $(this);
				var func = callback(element);
				$("#tray > div").each(func.call);
			});
			*/

			socket.emit("returnToTray", {});
			
		},
	}

})();

