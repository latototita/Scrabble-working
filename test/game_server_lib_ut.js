var expect = require("chai").expect;
var lib;

var mockPlayer = {
  id: "SOCKET_ID",
  emit: () => {
    console.log("Mock socket emit executed")
  }
  };

var SetUp = () => {
  lib = require("../lib/game_server_lib.js")(null);

  lib.BoardUtil.updateCurrentPlayer(mockPlayer);

  // Initialize tray tiles
  var id = 'tray-tile0' + mockPlayer.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'A', 1));
  id = 'tray-tile1' + mockPlayer.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'B', 3));
  id = 'tray-tile2' + mockPlayer.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'C', 3));
  id = 'tray-tile3' + mockPlayer.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'D', 2));
  id = 'tray-tile4' + mockPlayer.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'E', 1));
  id = 'tray-tile5' + mockPlayer.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'F', 4));
  id = 'tray-tile6' + mockPlayer.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'G', 2));

  for (var i = 0; i < 7; i++) {
     lib.BoardUtil.newCurrentTurnTile(i);
  }
}

var TearDown = () => {
  lib = null;
}

describe("game library tests", () => {

  describe("Core Board Utilities", () => {
    describe("setTile(): ", () => {
      it("Sets a board tile", () => {
        SetUp()
        var targetId = "tile7-7"
        var sourceId = "tray-tile3SOCKET_ID"
        var sourceTile = lib.BoardUtil.getTile(sourceId);
        lib.BoardUtil.setTile(targetId, sourceTile, false)

        var targetTile = lib.BoardUtil.getTile(targetId);
        expect(targetTile.character).to.equal('D')
        expect(targetTile.score).to.equal(2)
        expect(sourceTile.character).to.equal(null)
        expect(sourceTile.score).to.equal(null)
        TearDown()
      });
    });

    describe("swapCurTurnTiles(): ", () => {
    	it ("swaps tray tile with board tile", () => {
        SetUp()
    		var targetId = "tile7-7"
    		var trayTilePos = 1;
    		lib.BoardUtil.swapCurTurnTiles(trayTilePos, targetId);
    		var currentTurnTiles = lib.BoardUtil.getCurrentTurnTiles();

    		var checkSuccessful = false;
    		for (var i = 0; i < currentTurnTiles.length; i++) {
    			if (targetId == currentTurnTiles[i]) {
    				checkSuccessful = true;
    			}
    		}
    		expect(checkSuccessful).to.equal(true);
        lib.BoardUtil.swapCurTurnTiles(targetId, trayTilePos);
        TearDown()
    	});

    	it("swaps board tile with tray tile", () => {
        SetUp()
    		var trayTilePos = 1
    		var boardTile = "tile7-7";

    		lib.BoardUtil.swapCurTurnTiles(trayTilePos, boardTile)


    		lib.BoardUtil.swapCurTurnTiles(boardTile, trayTilePos);
    		var currentTurnTiles = lib.BoardUtil.getCurrentTurnTiles();

        console.log(lib.BoardUtil.getIdFromArg(trayTilePos))
    		expect(currentTurnTiles).to.be.an('array').that.includes(lib.BoardUtil.getIdFromArg(trayTilePos))
        TearDown()
    	});
    });


    describe("getCurrentBoardTiles", () => {
    	it("Returns all tiles on board", () => {
        SetUp()
    		lib.BoardUtil.swapCurTurnTiles(1, "tile7-7")
    		lib.BoardUtil.swapCurTurnTiles(3, "tile7-8")
    		lib.BoardUtil.swapCurTurnTiles(4, "tile7-9")
    		lib.BoardUtil.swapCurTurnTiles(5, "tile7-10")

    		var boardTiles = lib.BoardUtil.getCurrentBoardTiles();

        expect(boardTiles).to.be.an('array').that.includes("tile7-7");
        expect(boardTiles).to.be.an('array').that.includes("tile7-8");
        expect(boardTiles).to.be.an('array').that.includes("tile7-9");
        expect(boardTiles).to.be.an('array').that.includes("tile7-10");

        lib.BoardUtil.swapCurTurnTiles("tile7-7", 1)
        lib.BoardUtil.swapCurTurnTiles("tile7-8", 3)
        lib.BoardUtil.swapCurTurnTiles("tile7-9", 4)
        lib.BoardUtil.swapCurTurnTiles("tile7-10", 5)
        TearDown()
    	});
    });


    describe("updateAdjacentTiles(): ", () => {
        it("creates linked list of simple one line tiles", () => {
          SetUp()

          console.log("HESAFSDFSA")

          lib.BoardUtil.tileMoved(0, "tile7-7", false);
          lib.BoardUtil.tileMoved(1, "tile7-8", false);
          lib.BoardUtil.tileMoved(2, "tile7-9", false);
          lib.BoardUtil.tileMoved(3, "tile7-10", false);
          lib.BoardUtil.tileMoved(4, "tile7-11", false);

          lib.BoardUtil.updateAdjacentTiles();

          console.log(lib.BoardUtil.getCurrentBoardTiles());

          var traverse = lib.BoardUtil.getTile("tile7-7");
          var xCoord = 7;
          while(traverse.right.character) {
            expect(traverse.id).to.equal("tile7-" + xCoord++);
            traverse = traverse.right;
          }

          expect(traverse.id).to.equal("tile7-11");
          TearDown()
        });
    });


    describe("numCurTilesOnBoard(): ", () => {
      it("Returns tiles on board", () => {
        SetUp()
        lib.BoardUtil.tileMoved(0, "tile7-7", false);
        lib.BoardUtil.tileMoved(1, "tile7-8", false);
        lib.BoardUtil.tileMoved(2, "tile7-9", false);
        lib.BoardUtil.tileMoved(3, "tile7-10", false);
        lib.BoardUtil.tileMoved(4, "tile7-11", false);

        var num = lib.BoardUtil.numCurTilesOnBoard();
        expect(num).to.equal(5);
        TearDown()
      });
    });

    describe("returnToTray(): ", () => {
      it("returns board tiles to tray", () => {
        SetUp()
        lib.BoardUtil.tileMoved(0, "tile7-7", false);
        lib.BoardUtil.tileMoved(1, "tile7-8", false);
        lib.BoardUtil.tileMoved(2, "tile7-9", false);
        lib.BoardUtil.tileMoved(3, "tile7-10", false);
        lib.BoardUtil.tileMoved(4, "tile7-11", false);

        lib.BoardUtil.returnToTray(false);

        var currentTurnTiles = lib.BoardUtil.getCurrentTurnTiles();
        expect(currentTurnTiles.length).to.not.equal(0)
        for (var i = 0; i < currentTurnTiles.length; i++) {
          expect(currentTurnTiles[i].includes(mockPlayer.id)).to.equal(true);
        }

        for (var i = 7; i <= 11; i++) {
          expect(lib.BoardUtil.getTile("tile7-" + i).character).to.equal(null)
          expect(lib.BoardUtil.getTile("tile7-" + i).score).to.equal(null)
        }
        TearDown()
      });

      it("attempts to return with no tiles placed on board", () => {
        SetUp()
        lib.BoardUtil.returnToTray(false);
        TearDown()
      });

      it("return unconnected tiles", () => {
        SetUp()
        lib.BoardUtil.tileMoved(0, "tile7-1", false);
        lib.BoardUtil.tileMoved(1, "tile1-1", false);
        lib.BoardUtil.tileMoved(2, "tile9-9", false);
        lib.BoardUtil.tileMoved(3, "tile13-10", false);
        lib.BoardUtil.tileMoved(4, "tile6-11", false);

        lib.BoardUtil.returnToTray(false);

        var currentTurnTiles = lib.BoardUtil.getCurrentTurnTiles();
        expect(currentTurnTiles.length).to.not.equal(0)
        for (var i = 0; i < currentTurnTiles.length; i++) {
          expect(currentTurnTiles[i].includes(mockPlayer.id)).to.equal(true);
        }

        for (var i = 7; i <= 11; i++) {
          expect(lib.BoardUtil.getTile("tile7-" + i).character).to.equal(null)
          expect(lib.BoardUtil.getTile("tile7-" + i).score).to.equal(null)
        }
        TearDown()
      });
    });


    describe("evaluateTilePlacementValidity(): ", () => {
      it("tests simple first line", () => {
        SetUp()
        lib.BoardUtil.tileMoved(0, "tile7-7", false);
        lib.BoardUtil.tileMoved(1, "tile7-8", false);
        lib.BoardUtil.tileMoved(2, "tile7-9", false);
        lib.BoardUtil.tileMoved(3, "tile7-10", false);
        lib.BoardUtil.tileMoved(4, "tile7-11", false);
        lib.BoardUtil.updateAdjacentTiles();

        var orientation = lib.BoardUtil.evaluateTilePlacementValidity();
        expect(orientation).to.equal('row');
        TearDown()
      });

      it("First single first tile ", () => {
        SetUp()
        lib.BoardUtil.tileMoved(0, "tile7-7", false);

        var orientation = lib.BoardUtil.evaluateTilePlacementValidity();
        expect(orientation).to.not.equal(false);
        TearDown()
      });

      it("test invalid placement", () => {
        SetUp()
        lib.BoardUtil.tileMoved(0, "tile7-1", false);
        lib.BoardUtil.tileMoved(1, "tile1-1", false);
        lib.BoardUtil.tileMoved(2, "tile9-9", false);
        lib.BoardUtil.tileMoved(3, "tile13-10", false);
        lib.BoardUtil.tileMoved(4, "tile6-11", false);

        var orientation = lib.BoardUtil.evaluateTilePlacementValidity();
        expect(orientation).to.equal(false);
        TearDown()
      });

      it("tests connection with other tiles", () => {
        SetUp()
        var t1 = lib.BoardUtil.getTile("tile7-6")
        var e  = lib.BoardUtil.getTile("tile7-7")
        var s  = lib.BoardUtil.getTile("tile7-8")
        var t2 = lib.BoardUtil.getTile("tile7-9")

        t1.right = e; e.left = t1;
        e.right = s;  s.left = e;
        s.right = t2; t2.left = s;

        t1.character = 'T'
        e.character  = "E"
        s.character  = "S"
        t2.character = "T"

        lib.BoardUtil.tileMoved(0, "tile6-7", false);
        lib.BoardUtil.tileMoved(1, "tile8-7", false);
        lib.BoardUtil.tileMoved(2, "tile9-7", false);
        lib.BoardUtil.tileMoved(3, "tile10-7", false);

        lib.BoardUtil.updateAdjacentTiles();
        var orientation = lib.BoardUtil.evaluateTilePlacementValidity();
        expect(orientation).to.equal('column');
        TearDown()
      });

      it("tests no connection with other tiles", () => {
        SetUp()
        var t1 = lib.BoardUtil.getTile("tile7-6")
        var e  = lib.BoardUtil.getTile("tile7-7")
        var s  = lib.BoardUtil.getTile("tile7-8")
        var t2 = lib.BoardUtil.getTile("tile7-9")

        t1.right = e; e.left = t1;
        e.right = s;  s.left = e;
        s.right = t2; t2.left = s;

        t1.character = 'T'
        e.character  = "E"
        s.character  = "S"
        t2.character = "T"

        lib.BoardUtil.tileMoved(0, "tile1-7", false);
        lib.BoardUtil.tileMoved(1, "tile2-7", false);
        lib.BoardUtil.tileMoved(2, "tile3-7", false);
        lib.BoardUtil.tileMoved(3, "tile4-7", false);

        lib.BoardUtil.updateAdjacentTiles();
        var orientation = lib.BoardUtil.evaluateTilePlacementValidity();
        expect(orientation).to.equal(false);
        TearDown()
      });

    });

});

  describe("Ancillary Library Functions", () => {
    describe("getIdFromArg(): ", () => {
      it("returns tray tile id from naked id", () => {
        SetUp()
        var id = lib.BoardUtil.getIdFromArg("tray-tile4")
        expect(id).to.equal("tray-tile4" + mockPlayer.id)
        TearDown()
      });

      it("returns id from cooridnate", () => {
        SetUp()
        var id = lib.BoardUtil.getIdFromArg([1, 14]);
        expect(id).to.equal("tile1-14")
        TearDown()
      });

      it("return tray tile id from index", () => {
        SetUp()
        var id = lib.BoardUtil.getIdFromArg(3);
        expect(id).to.equal("tray-tile3" + mockPlayer.id);
        TearDown()
      });
    });

    describe("getPosFromArg(): ", () => {
      it("returns coordinate from id", () => {
        SetUp()
        var coord = lib.BoardUtil.getPosFromArg("tile1-14");
        expect(coord[0]).to.equal(1)
        expect(coord[1]).to.equal(14)

        coord = lib.BoardUtil.getPosFromArg("tile10-12");
        expect(coord[0]).to.equal(10)
        expect(coord[1]).to.equal(12)
        TearDown()
      });
    });
  });

});
