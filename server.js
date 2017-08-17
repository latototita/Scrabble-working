var express = require('express'),
  socket = require('socket.io'),
  fs = require('fs'),
  http = require('http'),
  url = require('url'),
  mongoose = require('mongoose'),
  uniqid = require('uniqid')

var app = express(),
  server = http.Server(app),
  io = socket(server)

var GameStateLib = require('./lib/game_state.js')

server.listen(3000)
mongoose.connect('mongodb://localhost/test')

app.use(express.static('public'))

var db = mongoose.connection //FIXME
var Game

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
  var gameSchema = mongoose.Schema({
    roomId: String,
    status: String,

    players: [
      mongoose.Schema(
        {
          id: String,
          name: String,
          status: String
        },
        { _id: false }
      )
    ]
  })

  gameSchema.methods.findByRoomId = function(room) {
    return this.find({ roomId: room })
  }

  Game = mongoose.model('Game', new gameSchema())
})

app.post('/start', function(req, res) {
  var pid = uniqid(),
    roomId = uniqid(),
    players = [
      {
        id: pid + '-0',
        name: req.body.name,
        status: 'connected'
      },
      {
        id: pid + '-1',
        name: 'Open',
        status: 'Open'
      }
    ]

  Game.create(
    {
      roomId: roomId,
      status: 'Waiting',
      players: players
    },
    (err, game) => {
      var data = game.toJSON()
      data.action = 'begin'
      data.player = pid + '-0'
      res.send(data)
    }
  )
})

app.post('/join/:room', function(req, res) {
  var pid = uniqid(),
    player,
    pidx

  Game.findByRoomId(req.params.room, (err, game) => {
    if (err || !game) {
      res.send(400, {
        code: 'roomNotFound',
        message: 'Failed to find the expected game room'
      })
    } else {
      player = {
        id: pid,
        name: req.body.name,
        status: 'joined'
      }

      Game.joinRoom(
        {
          _id: game._id,
          'players.status': { $in: ['Open'] }
        },
        {
          $set: { 'players.$': player }
        },
        (err, game) => {
          var data
          if (game) {
            data.game.toJSON()
            data.action = 'join'
            data.player = pid

            res.send(data)
          } else {
            res.send(400, {
              code: 'gameFull',
              message: 'All available player slots have been filled'
            })
          }
        }
      )
    }
  })
})

var clients = []
var players = []
var spectators = []
var GameState

var numRooms = 0
var rooms = {}

io.sockets.on('connection', function(socket) {
  var roomName = 'room'
  if (url.pathname == '/') {
    roomName += roomNumber
  } else {
    roomName += url.searchParams.get('room')
  }
  socket.join(roomName)
  rooms.add(roomName)
  clients.push(socket)

  if (io.sockets.adapter.rooms[roomName].length == 2) {
    numRooms++
    GameState = GameStateLib(roomName, clients)
    GameState.startGame()
    clients = []
  }

  /*
  console.log("new connection: " + socket.id);
  clients.push(socket);
  if (clients.length == 2) {
    GameState = require("./lib/game_state.js")(io, clients);
    GameState.startGame();
  }
*/
  socket.on('endPress', function(data) {
    GameState.switchTurns()
  })
})
