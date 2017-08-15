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

exports = module.exports = function(io) {


return {

Tile: tile,

BoardUtil : (function() {

	var dictionairy = {};
	var PythonShell = require("python-shell");
	var tileMap = new Map();
	var coordGrid = [];
	var currentTurnTiles = [];
	var currentPlayer;
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
	// Construct dictionairy for word lookup
	var lineReader = require('readline').createInterface({
	  input: require('fs').createReadStream('lib/word-list.txt')
	});
	lineReader.on('line', function (line) {
	  dictionairy[line.toLowerCase()] = true;
	});

	// Initialize python-shell
	PythonShell.defaultOptions = {
		scriptPath: './lib'
	};

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

		updateCurrentPlayer: function(player) {
			currentPlayer = player;
		},

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

		tileMoved: function(_source, _target, sendToClient = true) {
			var sourceTile = this.getTile(_source);
			this.setTile(_target, sourceTile, sendToClient);
			this.swapCurTurnTiles(_source, _target);
			if (DEBUG) console.log("tileMoved: \n    source: " + _source + ". target: " + _target);
		},

		setTileMap: function(id, tile) {
			if(!tileMap.has(id)) {
				tileMap.set(id, tile);
			}
		},

		setTile: function(_target, _tile, sendToClient = true) {
			var targetTile = this.getTile(_target);

			targetTile.character = _tile.character;
			targetTile.score = _tile.score;

			_tile.character = null;
			_tile.score = null;

			if (sendToClient) {
				if (targetTile.coord) { // If the target tile is on the board
				io.sockets.emit('setTileChar', {
					targetId: targetTile.id,
					char: targetTile.character
				});
				} else {
				currentPlayer.emit('setTileChar', {
					targetId: targetTile.id.replace(currentPlayer.id, ""),
					char: targetTile.character
				});
				}
				}
		},

		swapCurTurnTiles: function(source, target){
			var sourceId = this.getIdFromArg(source);
			var targetId = this.getIdFromArg(target);
			console.log("swapTiles: " + sourceId + " | " + targetId);
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
			console.log("DONE SWAPPING ***********************");
		},

		tileDropped: function(sourceId, targetId) {
			this.tileMoved(sourceId, targetId);

		},

		getIdFromArg: function(callerParam) {
			switch(typeof callerParam) {
				case "string":
							if (callerParam.includes("tray-tile") && !callerParam.includes(currentPlayer.id)) {
								return callerParam + currentPlayer.id;
							} else {
								return callerParam;
							}
				case "object" : return "tile" + callerParam[0] + "-" + callerParam[1];
				case "number": return "tray-tile" + callerParam + currentPlayer.id;
			}
		},

	// Get tile coordinate
		getPosFromArg: function(callerParam) {
			switch(typeof callerParam) {				// Gets last two characters in ID; this will always be coordinates
				case "string":
					tile = this.getTile(callerParam);
					return tile ? tile.coord : null;
				case "object": return callerParam;
				case "number": return null;
			}
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
			for (var i = 0; i < numBoardTiles; i++) {
				var id     =  currentBoardTileList[i],
				    coords =  this.getPosFromArg(id),
				    tile   =  this.getTile(id),
				    x      =  coords[0],
				    y 		 =  coords[1];

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
				}
			}
		},

		getCurrentBoardTiles: function() {
			var currentBoardTileList = [];
			for (var i = 0; i < NUM_TRAY_TILES; i++) {
				if (this.getPosFromArg(currentTurnTiles[i]))							// get current turn tiles that are not
					currentBoardTileList.push(currentTurnTiles[i]);				// in the tray
			}
			return currentBoardTileList;
		},


		numCurTilesOnBoard: function() {
			var count = 0;

			for (var i = 0; i < NUM_TRAY_TILES; i++) {
				if (this.getTile(i).character){ count++;
					console.log(this.getTile(i).character + "***********************************");
				}
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

		resetCurrentTurnTiles: function() {
			currentTurnTiles = [];
		},

		newCurrentTurnTile: function(target) {
			currentTurnTiles.push(this.getIdFromArg(target));
		},

		returnToTray: function(sendToClient = true) {
			console.log("RETURNING TO TRAY **************");
			var boardTiles = [];
			for (var i = 0; i < currentTurnTiles.length; i++) {
		    if (!currentTurnTiles[i].includes(currentPlayer.id)) { // only tray tiles include currentPlayer.id
		    	boardTiles.push(currentTurnTiles[i]);
		    	for (var j = 0; j < NUM_TRAY_TILES; j++) {
		    		var id = "tray-tile" + i + currentPlayer.id;
		    		var tile = this.getTile(id);
		    		console.log("TILE: "); console.log(tile);
		    		if (tile && !tile.char) {
		    			this.tileMoved(currentTurnTiles[i], id);
		    			break;
		    		}
		    	}
		    }
			}
			if (sendToClient) {
				currentPlayer.broadcast.emit("removeCurrentTurnTiles", {
			    	boardTiles: boardTiles
			  });
			}

			for (var i = 0; i < currentTurnTiles.length; i++) {
				console.log(currentTurnTiles[i]);
			}

			console.log("RETURNED * *********************");
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

		evaluateTilePlacementValidity: function() {
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

			// If only one tile has been placed
			if (tilePos.length == 1) {
				var tile = this.getTile(tilePos[0]);
				if (tilePos[0] == 7 && tilePos[1] == 7) {
					return "row"; // Arbitrary
				} else if (tile.up && tile.up.character || tile.down && tile.down.character) {
					return "column";
				} else if (tile.right && tile.right.character || tile.left && tile.left.character) {
					return "row";
				} else {
					return false;
				}
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
			var traverse = this.getTile(tilePos[0]);

			if (isInRow) {
				while (traverse.left && traverse.left.character) {
					traverse = traverse.left;		// go all the way left then all the way right in linked list --
				}									// we don't know where in the chain we started
				while (traverse && traverse.character) {
					if (this.isCurrentTurnTile(traverse.id)) {
						count++;
						if (traverse.coord[0] == 7 && traverse.coord[1] == 7
									|| traverse.up && traverse.up.character && !this.isCurrentTurnTile(traverse.up.id)
									|| traverse.left && traverse.left.character && !this.isCurrentTurnTile(traverse.left.id)
									|| traverse.down && traverse.down.character && !this.isCurrentTurnTile(traverse.down.id)
									|| traverse.right && traverse.right.character && !this.isCurrentTurnTile(traverse.right.id))
						{
							isConnected = true
						}
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
						if (traverse.coord[0] == 7 && traverse.coord[1] == 7
									|| traverse.up && traverse.up.character && !this.isCurrentTurnTile(traverse.up.id)
									|| traverse.left && traverse.left.character && !this.isCurrentTurnTile(traverse.left.id)
									|| traverse.down && traverse.down.character && !this.isCurrentTurnTile(traverse.down.id)
									|| traverse.right && traverse.right.character && !this.isCurrentTurnTile(traverse.right.id))
						{
							isConnected = true
						}
					}
					traverse = traverse.down;
				}
			}

			var numCurTilesOnBoard = this.numCurTilesOnBoard();
			if (count < numCurTilesOnBoard) {
				if (DEBUG) console.log("evaluateTilePlacementValidity(): iterative count less than actual count");
				console.log("Count: " + count);
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
			return dictionairy[word.toLowerCase()] == true ? true : false;
		},

		calcScore: function(tileAlignment) {  // Row or column?
			console.log("CALCULATING ***************************");
			console.log(tileAlignment + "****************************************");
			var score = { val: 0 }; // so we can pass as reference to recursive calls
			var traverse;

			for (var i = 0; i < NUM_TRAY_TILES; i++) {
				if (this.getPosFromArg(currentTurnTiles[i]))	{		// get an arbitrary current turn tile that is not in tray
					traverse = this.getTile(currentTurnTiles[i]);
					break;
				}
			}
			//FIXME
			if (!traverse) {
				console.log("NO TRAVERSE!!!!!!!!!");
				console.log(currentTurnTiles);
			}

			if (tileAlignment == "row") {
				while (traverse.left && traverse.left.character) traverse = traverse.left;
			} else if (tileAlignment == "column") {
				while (traverse.up && traverse.up.character) traverse = traverse.up;
			} else {
				console.log("Game.calcScore() --> tileAlignment argument is invalid: " + tileAlignment)
			}

			var wordList = [""];

			var result = this.calcScoreNittyGritty(traverse, tileAlignment, score, wordList);

			if (!(result === true)) {
				console.log("CALCSCORE FINISHED : RETURNED FALSE **************************************");
				console.log("Invalid word: " + result);
				return false;
			}

			/*
			 *	TODO: add html elements to display total score, words created this turn, maybe a word history...
			 */
			console.log("CALCSCORE FINISHED : RETURNED SCORE **************************************");
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

			if (alignment == "row") {
				while (traverse.up && traverse.up.character) traverse = traverse.up;
				console.log(traverse.character);
				console.log((traverse != curTile || (curTile.right && curTile.right.character)));
				console.log(alignment);
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

		bestWord: function() {
			// Constuct vertical words and horizontal words for python script
			var pyArgs = [''];
			for (var i = 0; i < currentTurnTiles.length; i++) {
				pyArgs[0] += this.getTile(currentTurnTiles[i]).character;
			}

			for (var row = 0; row < NUM_ROWS; row++) {
				var verticalWord = '';
				for (var column = 0; column < NUM_COLUMNS; column++) {
					var char = this.getTile([row, column]).character;
					verticalWord += char ? char : ' ';
				}
				var strToPush = verticalWord;
				if (row < 10) {
					strToPush = 'r' + row + '-' + strToPush;	// For python parsing
				} else {
					strToPush = 'r' + row + strToPush;
				}
				pyArgs.push(strToPush);
			}

			for (var column = 0; column < NUM_COLUMNS; column++) {
				var verticalWord = '';
				for (var row = 0; row < NUM_ROWS; row++) {
					var char = this.getTile([row, column]).character;
					verticalWord += char ? char : ' ';
				}
				var strToPush = verticalWord;
				if (column < 10) {
					strToPush = 'c' + column + '-' + strToPush;	// For python parsing
				} else {
					strToPush = 'c' + column + strToPush;
				}
				pyArgs.push(strToPush);
			}

			var options = {
	      mode: 'text',
	      pythonPath: 'C:/Users/Ben/AppData/Local/Programs/Python/Python36/python.exe',
	      pythonOptions: ['-u'],
	      // make sure you use an absolute path for scriptPath
	      scriptPath: 'C:/Users/Ben/Desktop/github/scrabble/lib',
	      args: pyArgs
	    };

			PythonShell.run('best_word.py', options, (err, results) => {
				if (err) throw err;
	      // results is an array consisting of messages collected during execution
	      var maxScore = 0;
	      var bestWord = "";
	      var bestAlignment, bestSector, bestStartPos;

	      for (var i = 0; i < results.length; i++) {
	      	var startPos = parseInt(results[i++]);
	      	var orientation = results[i++];
	      	var word = results[i]
	      	var score = false;

	      	var alignment = orientation[0] == 'r' ? "row" : "column";
	      	var sector = orientation[2] == '-' ? orientation[1] : orientation[1] + orientation[2];
	      	sector = parseInt(sector);

	      	for (var j = 0; j < word.length - 1; j++) {
	      		var targetId = 'tile';
	      		var row 	 = alignment == "row" ? sector : (startPos + j);
	      		var column = alignment == "column" ? sector : (startPos + j);
	      		console.log("START POS: " + startPos);
	      		console.log("WORD: " + word);
	      		console.log("Word length " + word.length);
	      		console.log("align: " +  alignment);
	      		targetId = targetId.concat(row.toString());
	      		targetId = targetId.concat('-'); //, '-', column.toString());
	      		targetId = targetId.concat(column.toString());
	      		console.log("BEST WORD TARGET ID: " + targetId);
	      		if (!this.getTile(targetId).character) {
		      		for (var k = 0; k < NUM_TRAY_TILES; k++) {
		      			var trayTile = this.getTile(currentTurnTiles[k]);
		      			if (trayTile.coord != null) {
		      				continue;
		      			}
		      			if (trayTile.character === word[j]) {
		      				this.tileMoved(currentTurnTiles[k], targetId, false);
		      				break;
		      			}

		      		}
		      	}
	      	}
	      	console.log(alignment + "**************************************************************************");
	      	score = this.calcScore(alignment);
	      	if (score && score > maxScore) {
	      		maxScore = score;
	      		bestWord = word;
	      		bestAlignment = alignment;
	      		bestSector = sector;
	      		bestStartPos = startPos;
	      	}
	      	this.returnToTray();
	      }
	      if (bestWord === '') {
	      	console.log("NO POSSIBLE WORDS");
	      	return;
	      }
	      console.log(maxScore + " : " + bestWord + " : " + bestWord.length);
	      for (var j = 0; j < bestWord.length - 1; j++) {
      		var targetId = 'tile';
      		var row 	 = bestAlignment == 'row' 	 ? bestSector : (bestStartPos + j);
      		var column = bestAlignment == 'column' ? bestSector : (bestStartPos + j);

      		targetId = targetId.concat(row.toString());
      		targetId = targetId.concat('-'); //, '-', column.toString());
      		targetId = targetId.concat(column.toString());

      		if (!this.getTile(targetId).character) {
	      		for (var k = 0; k < NUM_TRAY_TILES; k++) {
	      			var trayTile = this.getTile(currentTurnTiles[k]);
	      			if (trayTile.character === bestWord[j]) {
	      				var tileId = currentTurnTiles[k];
	      				if (trayTile.coord != null) {
		      				continue;
		      			}
	      				this.tileMoved(tileId, targetId, true);
	      				currentPlayer.emit('bestWordSet', {
	      					targetId: targetId,
	      					sourceId: tileId.replace(currentPlayer.id, "")
	      				});
	      				break;
	      			}
	      		}
	      	}
      	}
			});
		}
	};

})(), // end BoardUtil

};
};// end exports
