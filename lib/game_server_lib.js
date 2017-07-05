const NUM_ROWS = 15;
const NUM_COLUMNS = 15;
const NUM_TILES = NUM_ROWS * NUM_COLUMNS;
const NUM_TRAY_TILES = 7;
const BORDER_WIDTH = 1;
const DEBUG = true;
const CURRENT_TILE_CLASS = "current-turn-tiles";

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

exports = module.exports = function(io, playerSocket) {

return {

BoardUtil : (function() {

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
	
	var tileMap = new Map();
	var coordGrid = [];
	var currentTurnTiles = [];  

	// Construct grid of tiles.
	for (var i = 0; i < NUM_COLUMNS; i++) {
		var row = [];
		for (var j = 0; j < NUM_ROWS; j++) {
			var id = "tile" + i + "-" + j;
			var newTile = new tile(id, [i, j], null, null);
			tileMap.set(id, newTile);
			row.push(newTile);
		}
		coordGrid.push(row);
 	}


	// Public
	return {

		getTile: function(_target) {
			if (typeof _target == "object") {
				console.log(_target[0] + " targets     " + _target[1]);
				return coordGrid[_target[0]][_target[1]];
			}
			var id = this.getIdFromArg(_target);
			return tileMap.has(id) ? tileMap.get(id) : null;
		},

		hasTile: function(_target) {
			var id = this.getIdFromArg(_target);
			return tileMap.has(id);
		},

		getOriginalOffset: function(_target) {
			return tileMap.get(_target)[1];
		},

		getTrayTile: function(_target) {
			var id = this.getIdFromArg(_target);
			return tileMap.get(id)[0];
		},
		
		getTrayTileCharacter: function(_target) {
			return this.getTrayTile(_target).character;
		}, 

		tileMoved: function(_source, _target) {
			var sourceTile = this.getTile(_source);
			this.setTile(_target, sourceTile);
			this.swapCurTurnTiles(_source, _target);
			if (DEBUG) console.log("tileMoved: \n    source: " + _source + ". target: " + _target);
		},

		setTile: function(_target, _tile) {
			var targetTile = this.getTile(_target);

			targetTile.character = _tile.character;
			targetTile.score = _tile.score;

			_tile.character = null;
			_tile.score = null;

			console.log("targetTile: " + targetTile.character +"   " + targetTile.score);

			io.sockets.emit('setTileChar', {
				targetId: targetTile.id,
				char: targetTile.character
			});
		},

		setTrayTile: function(_target, _tile) {
			var id   = this.getIdFromArg(_target);
			var char = _tile.character;

			tileMap.set(id, _tile);
			
			playerSocket.emit('setTrayTileChar', {
				targetId: id,
				char: char
			});
		},

		swapCurTurnTiles: function(source, target){
			var sourceId = this.getIdFromArg(source);
			var targetId = this.getIdFromArg(target);
			if (sourceId === null) {
				currentTurnTiles.push(targetId);
			} else {
				for (var i = 0; i < NUM_TRAY_TILES; i++) {
					if (currentTurnTiles[i] === sourceId) {
						currentTurnTiles[i] = targetId;
						break;
					}
				}
			} 
		},

		tileDropped: function(sourceId, targetId) {	
			console.log("TILE DROPPED");
			this.tileMoved(sourceId, targetId);

		},

		getDomFromArg: function(callerParam) {	// Allows methods to take in multiple types
			switch(typeof callerParam) {
				case "string": return $("#" + callerParam);
				case "object" : return $("#tile" + callerParam[0] + "-" + callerParam[1]);
				case "number": return $("#tray-tile" + callerParam);
			}
		},

		getIdFromArg: function(callerParam) {
			switch(typeof callerParam) {
				case "string": return callerParam; 
				case "object" : return "tile" + callerParam[0] + "-" + callerParam[1];
				case "number": return "tray-tile" + callerParam;
			}
		},

	// Get tile coordinate
		getPosFromArg: function(callerParam) {
			switch(typeof callerParam) {				// Gets last two characters in ID; this will always be coordinates
				case "string": return this.getTile(callerParam).coord;
				case "object": return callerParam; 
				case "number": return null;
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

  // sets up a linked list to evaluate words; only updates tiles used this turn;
		updateAdjacentTiles: function() {

			var currentBoardTileList = [];

			for (var i = 0; i < NUM_TRAY_TILES; i++) {
				console.log(currentTurnTiles[i]);
				var temp = this.getPosFromArg(currentTurnTiles[i]);
				console.log("temp: " + temp);
				if (this.getPosFromArg(currentTurnTiles[i]))							// get current turn tiles that are not
					currentBoardTileList.push(currentTurnTiles[i]);				// in the tray
			}
			var numBoardTiles = this.numCurTilesOnBoard();
			for (var i = 0; i < numBoardTiles; i++) console.log(currentBoardTileList[i]);
			for (var i = 0; i < numBoardTiles; i++) {

				var id     =  currentBoardTileList[i],
				    coords =  this.getPosFromArg(id),    
				    tile   =  this.getTile(id),
				    x      =  coords[0], y = coords[1];	
				console.log("coords :" + coords[0] + ", " + coords[1]);
				tile.up    =  (x != 0) ? this.getTile([x - 1, y]) : null;
				tile.down  = (x != 14) ? this.getTile([x + 1, y]) : null;
				tile.left  =  (y != 0) ? this.getTile([x, y - 1]) : null;
				tile.right = (y != 14) ? this.getTile([x, y + 1]) : null;

				if (tile.up) tile.up.down = tile;
				if (tile.down) tile.down.up = tile;			// sets up bidirectional linked list
				if (tile.left) tile.left.right = tile;	
				if (tile.right) tile.right.left = tile;

				if (DEBUG) {
					console.log("updateAdjacentTiles: " + '\n' +
								"   coords: " + x + " , " + y + '\n' +
								"   arg: " + id + '\n' +
								"   result: ");
					console.log(tile);
				}
			}
		},

		setNextTurnTiles: function() {
			for (var i = 0; i < NUM_TRAY_TILES; i++) {
				if (!this.hasTile(i)) {
					var letter = this.getRandomLetter();
					//if (!letter) Game.endGame(); <-- maybe not? -- TODO
					this.setTrayTile(i, new tile(this.getIdFromArg(i), null, letter.character, letter.score));
					currentTurnTiles.push(this.getIdFromArg(i));
				}
			}
			playerSocket.emit("setNextTurnTiles", {});
		},

		numCurTilesOnBoard: function() {
			var count = 0;

			for (var i = 0; i < NUM_TRAY_TILES; i++) {
				if (this.getTile("tray-tile" + i).character) count++;
			}

			if (DEBUG) console.log("trayTileCount: " + count);
			return NUM_TRAY_TILES - count;
		},

		/*
		 * Count all tiles on board, ensure they are either in the same column or row,
		 * check if all tiles are contiguous 
		 *
		 * Returns false if invalid placement OTHERWISE returns orientation as string
		 */
		isCurrentTurnTile: function(target) {
			var id = this.getIdFromArg(target);
			for (var i = 0; i < NUM_TRAY_TILES; i++) {
				if (id === currentTurnTiles[i]) return true;
			}
			return false;
		},

		evalutateTilePlacementValidity: function() {
			if (!this.numCurTilesOnBoard()) {
				console.log("No tiles placed");
				return;
			}

			var tilePos 	= [],
			    isCorrect	= false,
			    isInRow 	= true, 
			    isInColumn 	= true;

			for (var i = 0; i < NUM_TRAY_TILES; i++) {
				var boardTileCoord = this.getPosFromArg(currentTurnTiles[i]);
				if (boardTileCoord) tilePos.push(boardTileCoord);
			}	

			tilePos.forEach((curVal, index, arr) => {
				if (curVal && arr[0][0] != curVal[0]) {
					isInRow = false;
				}
			});

			if (!isInRow) {
				tilePos.forEach((curVal, index, arr) => {
					if (curVal && arr[0][1] != curVal[1]) {
						isInColumn = false;
					}
				});
			} else {
				isInColumn = false;
			}

			if (DEBUG) { 
				console.log("evaluateTileValidity() : isInColumn: " + isInColumn + 
								", isInRow: " + isInRow);
			}

			if (!isInColumn && !isInRow) return false;

			var count = 0;
			var isConnected = false;
			var traverse = this.getTile(firstCoord);
			console.log(traverse);
		
			if (isInRow) {
				while (traverse.left && traverse.left.character) {
					traverse = traverse.left;		// go all the way left then all the way right in linked list --
				}									// we don't know where in the chain we started
				while (traverse && traverse.character) {
					if (this.isCurrentTurnTile(traverse.id)) {
						count++;
					} else {
						isConnected = true;
					}
					traverse = traverse.right;		
				}
			} else {
				while (traverse.up && traverse.up.character) {
					traverse = traverse.up;
				}									// up then down
				while(traverse && traverse.character) {
					if (this.isCurrentTurnTile(traverse.id)) {
						count++;
					} else {
						isConnected = true;
					}
					traverse = traverse.down;
				}
			}

			var numCurTilesOnBoard = this.numCurTilesOnBoard();
			if (count < numCurTilesOnBoard) {
				if (DEBUG) console.log("evaluateTilePlacementValidity(): iterative count less than actual count");
				return false;
			} 
			// TODO: Dont care about isConnected if it is the first turn.
			if (!isConnected) {
				if (DEBUG) console.log("evaluateTilePlacementValidity(): Tiles not connected");
				return false;
			}			
			if (DEBUG && count > numCurTilesOnBoard) { 
				console.log("Board.evaluateTilePlacementValidity()" + '\n' +
					"Iterative count greater than actual tile count. Something is very wrong!");
			}
		

			return isInRow ? "row" : "column";
		},

		// TODO
		isWord: function(word) {
			return true;
		},

		calcScore: function(tileAlignment) {  // Row or column?
			var score = { val: 0 }; // so we can pass as reference to recursive calls
			var traverse;

			for (var i = 0; i < NUM_TRAY_TILES; i++) {
				if (this.getPosFromArg(currentTurnTiles[i]))	{		// get an arbitrary current turn tile that is not in tray
					traverse = this.getTile(currentTurnTiles[i]);		
					break;
				}		
			}
			console.log("Traverse: "); console.log(traverse);

			if (tileAlignment === "row") {
				while (traverse.left && traverse.left.character) traverse = traverse.left;
			} else if (tileAlignment === "column") {
				while (traverse.up && traverse.up.character) traverse = traverse.up;
			} else {
				console.log("Game.calcScore() --> tileAlignment argument is invalid: " + tileAlignment)
			}

			var wordList = [""];

			var result = this.calcScoreNittyGritty(traverse, tileAlignment, score, wordList);

			if (!(result === true)) {
				console.log("Invalid word: " + result);
				return false;
			}

			/*
			 *	TODO: add html elements to display total score, words created this turn, maybe a word history...
			 */
			return score.val;
		},

	// returns true if all words are valid, OTHERWISE returns the invalid word
		calcScoreNittyGritty: function(curTile, alignment, score, wordList) {

			if (!curTile || !curTile.character) {
				var parallelWord = wordList[0];
				if (parallelWord != "" && !this.isWord(parallelWord)) return parallelWord;
				return true;
			}

			var traverse = curTile;
			var perpWord = "";

			if (alignment === "row") {
				while (traverse.up && traverse.up.character) traverse = traverse.up;
				if ((traverse != curTile || (curTile.down && curTile.down.character)) && this.isCurrentTurnTile(curTile.id)) {  
					while (traverse && traverse.character) {							// if there is a column of tiles for				   				
						perpWord += traverse.character;			// current tile -- a vertical word exists
						score.val += traverse.score;			// also checks if the current tile is a tile placed on this turn
						traverse = traverse.down;
					}
				}
			} else {
				while (traverse.left && traverse.left.character) traverse = traverse.left;
				if ((traverse != curTile || (curTile.right && curTile.right.character)) && this.isCurrentTurnTile(curTile.id)) { 
					while (traverse && traverse.character) {						// same check as above but for rows perpendicular to placed tiles    				
						perpWord += traverse.character;
						score.val += traverse.score;
						traverse = traverse.right;
					}
				}
			}

			if (perpWord != "") {
				if(!this.isWord(perpWord)) return perpWord;
				wordList.push(perpWord);
			}
			  
			wordList[0] += curTile.character;  // wordList[0] is the parallel word  
			score.val += curTile.score;
			console.log(wordList);
			
			if (alignment == "row")
				return this.calcScoreNittyGritty(curTile.right, alignment, score, wordList);
			if (alignment == "column")
				return this.calcScoreNittyGritty(curTile.down, alignment, score, wordList);
		},

		endTurn: function() {
			currentTurnTiles = [];
		}
	};

})(),

}
};// end exports
