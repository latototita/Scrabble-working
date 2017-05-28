const NUM_ROWS = 15;
const NUM_COLUMNS = 15;
const NUM_TILES = NUM_ROWS * NUM_COLUMNS;
const NUM_TRAY_TILES = 7;
const BORDER_WIDTH = 1;

$(document).ready(function() {
	var boardEl = $("#board");
	for (var i = 0; i < NUM_ROWS; i++) {
		boardEl.append("<div id='row" + i + "' class='row'></div>");
		for (var j = 0; j < NUM_COLUMNS; j++) {
			var id = 'tile' + (i+1) + (j+1);
			$("#row" + i).append("<div id='" + id + "' class='tile'></div>");	
			Board.setTile(i, j, new tile(id, true, null, 0));
			console.log("first: "+ id);
			$("#" + id).droppable({
				drop: function(event, ui) {
					var sourceId = ui.draggable.attr('id');
					console.log(id);
					Board.tileMoved(sourceId, $(this).attr('id'));
					ui.draggable.hide();
				}
			});

		} 
	} 

	var tray = $("#tray");
	for (var i = 0; i < NUM_TRAY_TILES; i++) {
		var id = "tray-tile" + i;
		tray.append("<div id='tray-tile" + i + "' class='tile' class='current-turn-tiles'></div>");
		Board.setTrayTile(i, new tile(id, true, "A", 12));
	}

	resizeUI();
	Game.startTurn();

});


function resizeUI() {
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
};

var resizeTimer;
$(window).resize(function() {
	clearTimeout(resizeTimer);
	resizeTimer = setTimeout(resizeUI, 50);
})


