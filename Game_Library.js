const NUM_ROWS = 15;
const NUM_COLUMNS = 15;
const NUM_TILES = NUM_ROWS * NUM_COLUMNS;
const NUM_TRAY_TILES = 7;
const BORDER_WIDTH = 1;

function tile(_isFree, _character, _score) {
	this.isFree = _isFree;
	this.letter = {
		character: _character,
		score: _score
	}
};

var Board = (function() {

	// Private
	var rowEntries = new Array();
	var columnEntries = new Array();
	var tileMap = new Map();

	// Public
	return {

		getTile: function(_row, _column) {
			let id = "tile" + _row + _column;
			return tileMap.get(id);
		},

		getTileVacancy: function(_row, _column) {
			let id = "tile" + _row + _column;
			return tileMap.get(id).isFree;
		},

		getTileLetter: function(_row, _column) {
			let id = "tile" + _row + _column;
			return tileMap.get(id).letter;
		},

		getTrayTile: function(_number) {
			let id = "tray-tile" + _number;
			return tileMap.get(id)
		},

		getTrayTileLetter: function(_number) {
			let id = "tray-tile" + _number;
			return tileMap.get(id).letter;
		},

		tileMoved: function(target_id, source_id) {
			setTile(target_id, getTile(source_id));
		},

		setTile(_row, _column, _tile) {
			let id = "tile" + _row + _column;
			tileMap.set(id, _tile);
		},

		setTrayTile(_number, _tile) {
			let id = "tray-tile" + _number;
			tileMap.set(id, _tile);
		}
	};

})();

var Game = (function () {

	//public
	return{
		startTurn: function() {
			for (let i = 0; i < NUM_TRAY_TILES; i++) {
				$("#tray-tile" + i ).draggable();
			}
		}
	};
})();