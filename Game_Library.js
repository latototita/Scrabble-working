const NUM_ROWS = 15;
const NUM_COLUMNS = 15;
const NUM_TILES = NUM_ROWS * NUM_COLUMNS;
const NUM_TRAY_TILES = 7;
const BORDER_WIDTH = 1;

function tile(_id, _character, _score) {
	this.id = _id;
	this.letter = {
		character: _character,
		score: _score
	}
	//$("#" + this.id).html("<p>" + this.letter.character + "</p>");
};

var UI = (function() {

	return {
		init: function() {
			var boardEl = $("#board");
			for (var i = 0; i < NUM_ROWS; i++) {
				boardEl.append("<div id='row" + i + "' class='row'></div>");
				var curRow = boardEl.children("#row" + i);
				for (var j = 0; j < NUM_COLUMNS; j++) {
					var id = 'tile' + (i+1) + (j+1);
					curRow.append("<div id='" + id + "' class='tile'></div>");
				} 
				Board.setTileDroppable(curRow.find(".tile"));
			} 

			var tray = $("#tray");
			for (var i = 0; i < NUM_TRAY_TILES; i++) {
				var id = "tray-tile" + i;
				tray.append("<div id='tray-tile" + i + "' class='tile' class='current-turn-tiles'></div>");
				Board.setTrayTile(i, new tile(id, "A", 12));
			}

			this.resizeUI();
		},

		resizeUI: function() {

			var boardEl = $("#board");
			var rows = $(".row");
			var tiles = $(".tile");
			var tray = $("#tray");

			var boardLength = boardEl.width();
			var rowHeight = boardLength / NUM_ROWS - BORDER_WIDTH;
			var tileWidth = boardLength / NUM_COLUMNS - BORDER_WIDTH;

			boardEl.css('height', boardLength);
			rows.css('height', rowHeight);
			rows.css('width', boardLength);
			tiles.css('height', rowHeight);
			tiles.css('width', tileWidth);
			tray.css('height', rowHeight);
			tray.css('width', (tileWidth + BORDER_WIDTH) * NUM_TRAY_TILES);
		},


	}

})();

var Board = (function() {

	// Private
	var tileMap = new Map();
	var currentTurnTiles = new Array();

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

			tileMap.delete(source_id);
		},

		setTile: function(_row, _column, _tile) {
			let id = "tile" + _row + _column;
			tileMap.set(id, _tile);
			var char = this.getTileLetter(_row, _column).character;
			if (char != null) $("#" + id).html("<p>" + char + "</p>").show();
		},

		setTileById: function(_target, _tile) {
			target = this.idDomOrPos(_target);
			tileMap.set(target.attr('id'), _tile);
			var char = _tile.letter.character;
			console.log(target + " -- character: " + char);
			if (char) target.html("<p>" + char + "</p>").show();
		},

		setTrayTile: function(_number, _tile) {
			let id = "tray-tile" + _number;
			tileMap.set(id, _tile);
			var char = _tile.letter.character;
			if (char) $("#" + id).html("<p>" + char + "</p>").show();
		},

		setTileDraggable: function(target) {
			el = this.idDomOrPos(target);
			if (el.draggable("instance")) {		// If there' already an instance,
				el.draggable("enable");			// just enable.
			} else {
				el.draggable({
					revert: true,
					revertDuration: 0
				});
			}
		},

		setTileDroppable: function(target) {
			el = this.idDomOrPos(target);
			el.droppable({
				drop: function(event, ui) {
					var targetId = $(this).attr('id');
					if (tileMap.has(targetId)) { 
						return; // space is occupied -- do nothing.
					}
					var sourceId = ui.draggable.attr('id');
					Board.tileMoved(sourceId, targetId);
					Board.setBlankSpace(sourceId);
					Board.setTileDraggable(targetId);
					console.log(sourceId + " dropped. "
						+ targetId + " now draggable");
				}
			});
		},

		setBlankSpace: function(_id) {
			$("#" + _id).html("").draggable("disable");
		},

		//Terrible, nifty code
		idDomOrPos(callerParam) {	//Allows functions to take in multiple types
			return jQuery.type(callerParam) === "string" ?
						$("#" + callerParam) : 
						(jQuery.type(callerParam) === "array" ? 
						$("#tile" + callerParam[0] + callerParam[1]) :
						callerParam );
		}
	};

})();

var Game = (function () {

	//public
	return{
		startTurn: function() {
			Board.setTileDraggable($("#tray > div"));
		}
	};
})();