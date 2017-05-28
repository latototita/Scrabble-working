
$(document).ready(function() {
	var boardEl = $("#board");
	for (let i = 0; i < NUM_ROWS; i++) {
		boardEl.append("<div id='row" + i + "' class='row'></div>");
		for (let j = 0; j < NUM_COLUMNS; j++) {
			let id = 'tile' + (i+1) + (j+1);
			$("#row" + i).append("<div id='" + id + "' class='tile'></div>");	
			Board.setTile(i, j, new tile(true, null, 0));
		} 
	} 

	var tray = $("#tray");
	for (let i = 0; i < NUM_TRAY_TILES; i++) {
		let id = "tray-tile" + i;
		tray.append("<div id='tray-tile" + i + "' class='tile' class='current-turn-tiles'></div>");
		Board.setTrayTile(i, new tile(null, null, null));
	}

	resizeUI();
	Game.startTurn();

});


function resizeUI() {
	var boardEl = $("#board");
	var rows = $(".row");
	var tiles = $(".tile");
	var tray = $("#tray");

	let boardLength = boardEl.width();
	let rowHeight = boardLength / NUM_ROWS - BORDER_WIDTH;
	let tileWidth = boardLength / NUM_COLUMNS - BORDER_WIDTH;

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


