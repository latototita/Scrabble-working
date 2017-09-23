const NUM_ROWS = 15;
const NUM_COLUMNS = 15;
const NUM_TILES = NUM_ROWS * NUM_COLUMNS;
const NUM_TRAY_TILES = 7;
const BORDER_WIDTH = 1;
const DEBUG = true;
const CURRENT_TILE_CLASS = 'current-turn-tiles';

exports = module.exports = function(io, room) {
  function tile(_id, _coord, _character, _score) {
    (this.id = _id), (this.coord = _coord), (this.character = _character), (this.score = _score), (this.left = null), (this.up = null), (this.right = null), (this.down = null);
  }

  return {
    Tile: tile,

    BoardUtil: (function(io, room) {
      let dictionary = {};
      let PythonShell = require('python-shell');
      let tileMap = new Map();
      let coordGrid = [];
      let currentTurnTiles = [];
      let currentPlayer;
      let isBestWordProcessing;
      let tileBase = {
        A: { count: 9,  score: 1,  character: 'A' },
        B: { count: 2,  score: 3,  character: 'B' },
        C: { count: 2,  score: 3,  character: 'C' },
        D: { count: 4,  score: 2,  character: 'D' },
        E: { count: 12, score: 1,  character: 'E' },
        F: { count: 2,  score: 4,  character: 'F' },
        G: { count: 3,  score: 2,  character: 'G' },
        H: { count: 2,  score: 4,  character: 'H' },
        I: { count: 9,  score: 1,  character: 'I' },
        J: { count: 1,  score: 8,  character: 'J' },
        K: { count: 1,  score: 5,  character: 'K' },
        L: { count: 4,  score: 1,  character: 'L' },
        M: { count: 2,  score: 3,  character: 'M' },
        N: { count: 6,  score: 1,  character: 'N' },
        O: { count: 8,  score: 1,  character: 'O' },
        P: { count: 2,  score: 3,  character: 'P' },
        Q: { count: 1,  score: 10, character: 'Q' },
        R: { count: 6,  score: 1,  character: 'R' },
        S: { count: 4,  score: 1,  character: 'S' },
        T: { count: 6,  score: 1,  character: 'T' },
        U: { count: 4,  score: 1,  character: 'U' },
        V: { count: 2,  score: 4,  character: 'V' },
        W: { count: 2,  score: 4,  character: 'W' },
        X: { count: 1,  score: 8,  character: 'X' },
        Y: { count: 2,  score: 4,  character: 'Y' },
        Z: { count: 1,  score: 10, character: 'Z' }
      };
      // Construct dictionary for word lookup
      let lineReader = require('readline').createInterface({
        input: require('fs').createReadStream('lib/word-list.txt')
      });
      lineReader.on('line', function(line) {
        dictionary[line.toLowerCase()] = true;
      });

      // Initialize python-shell
      PythonShell.defaultOptions = {
        scriptPath: './lib'
      };

      // Construct grid of tiles.
      for (let i = 0; i < NUM_COLUMNS; i++) {
        let row = [];
        for (let j = 0; j < NUM_ROWS; j++) {
          let id = 'tile' + i + '-' + j;
          let newTile = new tile(id, [i, j], null, null);
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
          if ((typeof _target) == 'object') {
            _target[0] + ' targets     ' + _target[1];
            return coordGrid[_target[0]][_target[1]];
          }
          let id = this.getIdFromArg(_target);
          return tileMap.has(id) ? tileMap.get(id) : null;
        },

        hasTile: function(_target) {
          let id = this.getIdFromArg(_target);
          return tileMap.has(id);
        },

        getOriginalOffset: function(_target) {
          return tileMap.get(_target)[1];
        },

        getTrayTile: function(_target) {
          let id = this.getIdFromArg(_target);
          return tileMap.get(id)[0];
        },

        getTrayTileCharacter: function(_target) {
          return this.getTrayTile(_target).character;
        },

        tileMoved: function(_source, _target, sendToClient = true) {
          let sourceTile = this.getTile(_source);
          this.setTile(_target, sourceTile, sendToClient);
          this.swapCurTurnTiles(_source, _target);
          if (DEBUG)
            console.log(
              'tileMoved: \n    source: ' + _source + '. target: ' + _target
            );
        },

        setTileMap: function(id, tile) {
          if (!tileMap.has(id)) {
            tileMap.set(id, tile);
          }
        },

        setTile: function(_target, _tile, sendToClient = true) {
          let targetTile = this.getTile(_target);

          targetTile.character = _tile.character;
          targetTile.score = _tile.score;

          _tile.character = null;
          _tile.score = null;

          if (sendToClient) {
            if (targetTile.coord) {
              // If the target tile is on the board
              io.sockets.in(room).emit('setTileChar', {
                targetId: targetTile.id,
                char: targetTile.character
              });

              currentPlayer.emit('setTileChar', {
                targetId: targetTile.id.replace(currentPlayer.id, ''),
                char: targetTile.character
              });
            } else {
              currentPlayer.emit('setTileChar', {
                targetId: targetTile.id.replace(currentPlayer.id, ''),
                char: targetTile.character
              });
            }
          }
        },

        swapCurTurnTiles: function(source, target) {
          let sourceId = this.getIdFromArg(source);
          let targetId = this.getIdFromArg(target);
          if (sourceId === null) {
            currentTurnTiles.push(targetId);
          } else {
            for (let i = 0; i < NUM_TRAY_TILES; i++) {
              if (currentTurnTiles[i] === sourceId) {
                currentTurnTiles[i] = targetId;
                break;
              }
            }
          }
        },

        tileDropped: function(sourceId, targetId) {
          this.tileMoved(sourceId, targetId);
        },

        getIdFromArg: function(callerParam) {
          switch (typeof callerParam) {
            case 'string':
              if (
                callerParam.includes('tray-tile') &&
                !callerParam.includes(currentPlayer.id)
              ) {
                return callerParam + currentPlayer.id;
              } else {
                return callerParam;
              }
            case 'object':
              return 'tile' + callerParam[0] + '-' + callerParam[1];
            case 'number':
              return 'tray-tile' + callerParam + currentPlayer.id;
          }
        },

        // Get tile coordinate
        getPosFromArg: function(callerParam) {
          switch (typeof callerParam) { // Gets last two characters in ID; this will always be coordinates
            case 'string':
              tile = this.getTile(callerParam);
              return tile ? tile.coord : null;
            case 'object':
              return callerParam;
            case 'number':
              return null;
          }
        },

        // sets up a linked list to evaluate words; only updates tiles used this turn;
        updateAdjacentTiles: function() {
          let currentBoardTileList = [];

          for (let i = 0; i < NUM_TRAY_TILES; i++) {
            if (
              this.getPosFromArg(currentTurnTiles[i]) // get current turn tiles that are not
            )
              currentBoardTileList.push(currentTurnTiles[i]); // in the tray
          }
          let numBoardTiles = this.numCurTilesOnBoard();
          for (let i = 0; i < numBoardTiles; i++) {
            let id = currentBoardTileList[i],
              coords = this.getPosFromArg(id),
              tile = this.getTile(id),
              x = coords[0],
              y = coords[1];

            tile.up = x != 0 ? this.getTile([x - 1, y]) : null;
            tile.down = x != 14 ? this.getTile([x + 1, y]) : null;
            tile.left = y != 0 ? this.getTile([x, y - 1]) : null;
            tile.right = y != 14 ? this.getTile([x, y + 1]) : null;

            if (tile.up) tile.up.down = tile;
            if (tile.down) tile.down.up = tile; // sets up bidirectional linked list
            if (tile.left) tile.left.right = tile;
            if (tile.right) tile.right.left = tile;

            if (DEBUG) {
              console.log(
                'updateAdjacentTiles: ' +
                  '\n' +
                  '   coords: ' +
                  x +
                  ' , ' +
                  y +
                  '\n' +
                  '   arg: ' +
                  id +
                  '\n' +
                  '   result: '
              );
            }
          }
        },

        getCurrentBoardTiles: function() {
          let currentBoardTileList = [];
          for (let i = 0; i < NUM_TRAY_TILES; i++) {
            if (
              !this.getIdFromArg(currentTurnTiles[i]).includes(currentPlayer.id) // get current turn tiles that are not
            )
              currentBoardTileList.push(currentTurnTiles[i]); // in the tray
          }
          return currentBoardTileList;
        },

        numCurTilesOnBoard: function() {
          let count = 0;

          for (let i = 0; i < NUM_TRAY_TILES; i++) {
            if (this.getTile(i).character) count++;
          }

          if (DEBUG) console.log('trayTileCount: ' + count);
          return NUM_TRAY_TILES - count;
        },

        /*
		 * Count all tiles on board, ensure they are either in the same column or row,
		 * check if all tiles are contiguous
		 *
		 * Returns false if invalid placement OTHERWISE returns orientation as string
		 */
        isCurrentTurnTile: function(target) {
          let id = this.getIdFromArg(target);
          for (let i = 0; i < NUM_TRAY_TILES; i++) {
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

        getCurrentTurnTiles: function() {
          return currentTurnTiles;
        },

        returnToTray: function(sendToClient = true) {
          let boardTiles = [];
          for (let i = 0; i < currentTurnTiles.length; i++) {
            if (!currentTurnTiles[i].includes(currentPlayer.id)) {
              // only tray tiles include currentPlayer.id
              boardTiles.push(currentTurnTiles[i]);
              for (let j = 0; j < NUM_TRAY_TILES; j++) {
                let id = 'tray-tile' + i + currentPlayer.id;
                let tile = this.getTile(id);
                if (tile && !tile.char) {
                  this.tileMoved(currentTurnTiles[i], id);
                  break;
                }
              }
            }
          }
          if (sendToClient) {
            currentPlayer.broadcast.to(room).emit('removeCurrentTurnTiles', {
              boardTiles: boardTiles
            });
          }
        },

        getRandomLetter: function() {
          let selector = Math.floor(Math.random() * 25) + 65, // Gets random ASCII value
            letter = tileBase[String.fromCharCode(selector)],
            endCount = 0;

          while (letter.count <= 0) {
            if (++selector > 90) selector = 65; // Gets next letter, wraps around.
            letter = tileBase[String.fromCharCode(selector)];
            if (++endCount > 26) return false; // game over
          }
          letter.count--;
          return letter;
        },

        evaluateTilePlacementValidity: function() {
          if (!this.numCurTilesOnBoard()) {
            console.log('No tiles placed');
            return;
          }

          let tilePos = [],
            isCorrect = false,
            isInRow = true,
            isInColumn = true;

          let boardTiles = this.getCurrentBoardTiles();

          for (let i = 0; i < boardTiles.length; i++) {
            tilePos.push(this.getPosFromArg(boardTiles[i]));
          }

          // If only one tile has been placed
          if (tilePos.length == 1) {
            let tile = this.getTile(tilePos[0]);
            if (tilePos[0][0] == 7 && tilePos[0][1] == 7) {
              return 'row'; // Arbitrary
            } else if (
              (tile.up && tile.up.character) ||
              (tile.down && tile.down.character)
            ) {
              return 'column';
            } else if (
              (tile.right && tile.right.character) ||
              (tile.left && tile.left.character)
            ) {
              return 'row';
            } else {
              return false;
            }
          }

          for (let i = 0; i < tilePos.length; i++) {
            if (tilePos[i][0] != tilePos[0][0]) isInRow = false;
            if (tilePos[i][1] != tilePos[0][1]) isInColumn = false;
          }

          if (isInRow) isInColumn = false;
          else if (isInColumn) isInRow = false;

          if (DEBUG) {
            console.log(
              'evaluateTileValidity() : isInColumn: ' +
                isInColumn +
                ', isInRow: ' +
                isInRow
            );
          }

          if (!isInColumn && !isInRow) return false;

          let count = 0;
          let isConnected = false;
          let traverse = this.getTile(tilePos[0]);

          if (isInRow) {
            while (traverse.left && traverse.left.character) {
              traverse = traverse.left; // go all the way left then all the way right in linked list --
            } // we don't know where in the chain we started
            while (traverse && traverse.character) {
              if (this.isCurrentTurnTile(traverse.id)) {
                count++;
                if (
                  (traverse.coord[0] == 7 && traverse.coord[1] == 7) ||
                  (traverse.up &&
                    traverse.up.character &&
                    !this.isCurrentTurnTile(traverse.up.id)) ||
                  (traverse.left &&
                    traverse.left.character &&
                    !this.isCurrentTurnTile(traverse.left.id)) ||
                  (traverse.down &&
                    traverse.down.character &&
                    !this.isCurrentTurnTile(traverse.down.id)) ||
                  (traverse.right &&
                    traverse.right.character &&
                    !this.isCurrentTurnTile(traverse.right.id))
                ) {
                  isConnected = true;
                }
              }
              traverse = traverse.right;
            }
          } else {
            while (traverse.up && traverse.up.character) {
              traverse = traverse.up;
            } // up then down
            while (traverse && traverse.character) {
              if (this.isCurrentTurnTile(traverse.id)) {
                count++;
                if (
                  (traverse.coord[0] == 7 && traverse.coord[1] == 7) ||
                  (traverse.up &&
                    traverse.up.character &&
                    !this.isCurrentTurnTile(traverse.up.id)) ||
                  (traverse.left &&
                    traverse.left.character &&
                    !this.isCurrentTurnTile(traverse.left.id)) ||
                  (traverse.down &&
                    traverse.down.character &&
                    !this.isCurrentTurnTile(traverse.down.id)) ||
                  (traverse.right &&
                    traverse.right.character &&
                    !this.isCurrentTurnTile(traverse.right.id))
                ) {
                  isConnected = true;
                }
              }
              traverse = traverse.down;
            }
          }

          let numCurTilesOnBoard = this.numCurTilesOnBoard();
          if (count < numCurTilesOnBoard) {
            if (DEBUG)
              console.log(
                'evaluateTilePlacementValidity(): iterative count' +
                  ' less than actual count \n' +
                  'This means placed tiles are not connected to eachother'
              );
            return false;
          }
          // TODO: Dont care about isConnected if it is the first turn.
          if (!isConnected) {
            if (DEBUG)
              console.log(
                'evaluateTilePlacementValidity(): Tiles placed not connected to existing tiles'
              );
            return false;
          }
          if (DEBUG && count > numCurTilesOnBoard) {
            console.log(
              'Board.evaluateTilePlacementValidity()' +
                '\n' +
                'Iterative count greater than actual tile count. Something is very wrong!'
            );
          }

          return isInRow ? 'row' : 'column';
        },

        // TODO
        isWord: function(word) {
          return dictionary[word.toLowerCase()] == true ? true : false;
        },

        calcScore: function(tileAlignment) {
          // Row or column?
          let score = { val: 0 }; // so we can pass as reference to recursive calls
          let traverse;

          for (let i = 0; i < NUM_TRAY_TILES; i++) {
            if (this.getPosFromArg(currentTurnTiles[i])) {
              // get an arbitrary current turn tile that is not in tray
              traverse = this.getTile(currentTurnTiles[i]);
              break;
            }
          }

          if (!traverse) {
            console.log(currentTurnTiles)
          }

          if (tileAlignment == 'row') {
            while (traverse.left && traverse.left.character)
              traverse = traverse.left;
          } else if (tileAlignment == 'column') {
            while (traverse.up && traverse.up.character) traverse = traverse.up;
          } else {
            console.log(
              'Game.calcScore() --> tileAlignment argument is invalid: ' +
                tileAlignment
            );
          }

          let wordList = [''];

          let result = this.calcScoreNittyGritty(
            traverse,
            tileAlignment,
            score,
            wordList
          );

          if (!(result === true)) {
            console.log('Invalid word: ' + result);
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
            let parallelWord = wordList[0];
            if (parallelWord != '' && !this.isWord(parallelWord))
              return parallelWord;
            return true;
          }

          let traverse = curTile;
          let perpWord = '';

          if (alignment == 'row') {
            while (traverse.up && traverse.up.character) traverse = traverse.up;
            if (
              (traverse != curTile ||
                (curTile.down && curTile.down.character)) &&
              this.isCurrentTurnTile(curTile.id)
            ) {
              while (traverse && traverse.character) {
                // if there is a column of tiles for
                perpWord += traverse.character; // current tile -- a vertical word exists
                score.val += traverse.score; // also checks if the current tile is a tile placed on this turn
                traverse = traverse.down;
              }
            }
          } else {
            while (traverse.left && traverse.left.character)
              traverse = traverse.left;

            if (
              (traverse != curTile ||
                (curTile.right && curTile.right.character)) &&
              this.isCurrentTurnTile(curTile.id)
            ) {
              while (traverse && traverse.character) {
                // same check as above but for rows perpendicular to placed tiles
                perpWord += traverse.character;
                score.val += traverse.score;
                traverse = traverse.right;
              }
            }
          }

          if (perpWord != '') {
            if (!this.isWord(perpWord)) return perpWord;
            wordList.push(perpWord);
          }

          wordList[0] += curTile.character; // wordList[0] is the parallel word
          score.val += curTile.score;
          console.log(wordList);

          if (alignment == 'row')
            return this.calcScoreNittyGritty(
              curTile.right,
              alignment,
              score,
              wordList
            );
          if (alignment == 'column')
            return this.calcScoreNittyGritty(
              curTile.down,
              alignment,
              score,
              wordList
            );
        },

        bestWord: function() {
          if (
            !isBestWordProcessing &&
            this.getCurrentBoardTiles().length == 0
          ) {
            isBestWordProcessing = true;
            // Constuct vertical words and horizontal words for python script
            let pyArgs = [''];
            for (let i = 0; i < currentTurnTiles.length; i++) {
              pyArgs[0] += this.getTile(currentTurnTiles[i]).character;
            }

            for (let row = 0; row < NUM_ROWS; row++) {
              let verticalWord = '';
              for (let column = 0; column < NUM_COLUMNS; column++) {
                let char = this.getTile([row, column]).character;
                verticalWord += char ? char : ' ';
              }
              let strToPush = verticalWord;
              if (row < 10) {
                strToPush = 'r' + row + '-' + strToPush; // For python parsing
              } else {
                strToPush = 'r' + row + strToPush;
              }
              pyArgs.push(strToPush);
            }

            for (let column = 0; column < NUM_COLUMNS; column++) {
              let verticalWord = '';
              for (let row = 0; row < NUM_ROWS; row++) {
                let char = this.getTile([row, column]).character;
                verticalWord += char ? char : ' ';
              }
              let strToPush = verticalWord;
              if (column < 10) {
                strToPush = 'c' + column + '-' + strToPush; // For python parsing
              } else {
                strToPush = 'c' + column + strToPush;
              }
              pyArgs.push(strToPush);
            }

            let options = {
              mode: 'text',
              pythonOptions: ['-u'],
              args: pyArgs
            };

            PythonShell.run('best_word.py', options, (err, results) => {
              console.log(results)
              if (err) throw err;
              // results is an array consisting of messages collected during execution
              let maxScore = 0;
              let bestWord = '';
              let bestAlignment, bestSector, bestStartPos;

              for (let i = 0; i < results.length; i++) {
                let startPos = parseInt(results[i++]);
                let orientation = results[i++];
                let word = results[i];
                let score = false;

                console.log("WORD")
                  console.log(word)

                let alignment = orientation[0] == 'r' ? 'row' : 'column';
                let sector =
                  orientation[2] == '-'
                    ? orientation[1]
                    : orientation[1] + orientation[2];
                sector = parseInt(sector);

                for (let j = 0; j < word.length; j++) {
                  let row = alignment == 'row' ? sector : startPos + j;
                  let column = alignment == 'column' ? sector : startPos + j;
                  let targetId = 'tile' + row + '-' + column
                  if (!this.getTile(targetId).character) {
                    for (let k = 0; k < NUM_TRAY_TILES; k++) {
                      let trayTile = this.getTile(currentTurnTiles[k]);
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
                console.log("Calcing")
                score = this.calcScore(alignment);
                if (score && score > maxScore) {
                  maxScore = score;
                  bestWord = word;
                  bestAlignment = alignment;
                  bestSector = sector;
                  bestStartPos = startPos;
                }
                console.log("RETURNING to tray")
                this.returnToTray();
              }
              if (bestWord === '') {
                console.log('NO POSSIBLE WORDS');
                // TODO: Alert client
                return;
              }
              console.log("HEREREE")
              for (let j = 0; j < bestWord.length; j++) {
                let row =
                  bestAlignment == 'row' ? bestSector : bestStartPos + j;
                let column =
                  bestAlignment == 'column' ? bestSector : bestStartPos + j;

                let targetId = 'tile' + row + '-' + column

                if (!this.getTile(targetId).character) {
                  for (let k = 0; k < NUM_TRAY_TILES; k++) {
                    let trayTile = this.getTile(currentTurnTiles[k]);
                    if (trayTile.character === bestWord[j]) {
                      let tileId = currentTurnTiles[k];
                      if (trayTile.coord != null) {
                        continue;
                      }
                      this.tileMoved(tileId, targetId, true);
                      currentPlayer.emit('bestWordSet', {
                        targetId: targetId,
                        sourceId: tileId.replace(currentPlayer.id, '')
                      });
                      isBestWordProcessing = false;
                      break;
                    }
                  }
                }
              }
            });
          }
        }
      };
    })(io, room) // end BoardUtil
  };
}; // end exports
