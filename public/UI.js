
var resizeTimer;
$(window).resize(function() {
	clearTimeout(resizeTimer);
	resizeTimer = setTimeout(UI.resizeUI, 50);
})

$(document).ready(function() {
	
	
	UI.init();
	Game.startTurn();


	
});


