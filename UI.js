const NUM_ROWS = 15;
const NUM_COLUMNS = 15;
const NUM_TILES = NUM_ROWS * NUM_COLUMNS;
const BORDER_WIDTH = 1;


var rowEntries = new Array();
var columnEntries = new Array();


function tile(_id, _isFree, _character, _score) {
	this.id = _id;
	this.free = _isFree;
	this.letter = {
		character: _character,
		score: _score
	}
};

$(document).ready(function() {
	for (let i = 0; i < NUM_ROWS; i++) {
		$("#board").append("<div id='row" + i + "' class='row'></div>");
		for (let j = 0; j < NUM_COLUMNS; j++) {
			let id = 'tile' + (i+1) + (j+1);
			$("#row" + i).append("<div id='" + id + "' class='tile'></div>");			
		} 
	} 
	resizeUI();
});




function resizeUI() {
	var board = $("#board");
	var rows = $(".row");
	var tiles = $ (".tile");

	let boardLength = board.width();
	board.css('height', boardLength);

	rows.css('height', boardLength / NUM_ROWS - BORDER_WIDTH);
	rows.css('width', boardLength);
	tiles.css('height', boardLength / NUM_ROWS - BORDER_WIDTH);
	tiles.css('width', boardLength / NUM_COLUMNS - BORDER_WIDTH);
};

var resizeTimer;
$(window).resize(function() {
	clearTimeout(resizeTimer);
	resizeTimer = setTimeout(resizeUI, 50);
})


