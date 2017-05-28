
function tile(_id, _isFree, _character, _score) {
	this.id = _id;
	this.isFree = _isFree;
	this.letter = {
		character: _character,
		score: _score
	}
	//$("#" + this.id).html("<p>" + this.letter.character + "</p>");
};

var Board = (function() {

	// Private
	var tileMap = new Map();

	// Public
	return {

		getTile: function(_row, _column) {
			let id = "tile" + _row + _column;
			return tileMap.get(id);
		},

		getTileById: function(_id) {
			return tileMap.get(_id);
		},

		getTileVacancy: function(_row, _column) {
			let id = "tile" + _row + _column;
			return tileMap.get(id).isFree;
		},

		getTileLetter: function(_row, _column) {
			let id = "tile" + _row + _column;
			return tileMap.get(id).letter;
		},

		getTileLetterById: function(_id) {
			return tileMap.get(_id).letter;
		},

		getTrayTile: function(_number) {
			let id = "tray-tile" + _number;
			return tileMap.get(id);
		},

		getTrayTileLetter: function(_number) {
			let id = "tray-tile" + _number;
			return tileMap.get(id).letter;
		},

		tileMoved: function(source_id, target_id) {
			this.setTileById(target_id, this.getTileById(source_id));
		},

		setTile: function(_row, _column, _tile) {
			let id = "tile" + _row + _column;
			tileMap.set(id, _tile);
			var char = this.getTileLetter(_row, _column).character;
			if (char != null) $("#" + id).html("<p>" + char + "</p>");
		},

		setTileById: function(_id, _tile) {
			tileMap.set(_id, _tile);
			var char = _tile.letter.character;
			console.log(_id + " -- character: " + char);
			if (char) $("#" + _id).html("<p>" + char + "</p>");
		},

		setTrayTile: function(_number, _tile) {
			let id = "tray-tile" + _number;
			tileMap.set(id, _tile);
			var char = _tile.letter.character;
			if (char) $("#" + id).html("<p>" + char + "</p>");
		}
	};

})();

var Game = (function () {

	//public
	return{
		startTurn: function() {
			for (let i = 0; i < NUM_TRAY_TILES; i++) {
				$("#tray-tile" + i ).draggable({
					revert: true
				});
			}
		}
	};
})();