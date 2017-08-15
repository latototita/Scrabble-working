var expect = require("chai").expect;
var lib = require("../lib/game_server_lib.js")(null);

describe("game library tests", () => {
  var player = {id: "SOCKET_ID"};
  lib.BoardUtil.updateCurrentPlayer(player);

  // Initialize tray tiles
  var id = 'tray-tile0' + player.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'A', 1));
  id = 'tray-tile1' + player.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'B', 3));
  id = 'tray-tile2' + player.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'C', 3));
  id = 'tray-tile3' + player.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'D', 2));
  id = 'tray-tile4' + player.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'E', 1));
  id = 'tray-tile5' + player.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'F', 4));
  id = 'tray-tile6' + player.id;
  lib.BoardUtil.setTileMap(id, new lib.Tile(id, null, 'G', 2));

  describe("Core Board Utilities", () => {
    describe("setTile(): ", () => {
      it("Sets a board tile", () => {
        var targetId = "tile7-7"
        var sourceId = "tray-tile3SOCKET_ID"
        var sourceTile = lib.BoardUtil.getTile(sourceId);
        lib.BoardUtil.setTile(targetId, sourceTile, false)

        var targetTile = lib.BoardUtil.getTile(targetId);
        expect(targetTile.character).to.equal('D')
        expect(targetTile.score).to.equal(2)
      });
    });
  });

  describe("Ancillary Library Functions", () => {
    describe("getIdFromArg(): ", () => {

      it("returns tray tile id from naked id", () => {
        var id = lib.BoardUtil.getIdFromArg("tray-tile4")
        expect(id).to.equal("tray-tile4" + player.id)
      });

      it("returns id from cooridnate", () => {
        var id = lib.BoardUtil.getIdFromArg([1, 14]);
        expect(id).to.equal("tile1-14")
      });

      it("return tray tile id from index", () => {
        var id = lib.BoardUtil.getIdFromArg(3);
        expect(id).to.equal("tray-tile3" + player.id);
      });
    });

    describe("getPosFromArg(): ", () => {
      it("returns coordinate from id", () => {
        var coord = lib.BoardUtil.getPosFromArg("tile1-14");
        expect(coord[0]).to.equal(1)
        expect(coord[1]).to.equal(14)

        coord = lib.BoardUtil.getPosFromArg("tile10-12");
        expect(coord[0]).to.equal(10)
        expect(coord[1]).to.equal(12)
      });
    });
  });

});
