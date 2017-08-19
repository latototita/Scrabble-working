const NUM_REQUIRED_PLAYERS = 2

var express = require('express'),
  socket = require('socket.io'),
  fs = require('fs'),
  http = require('http'),
  url = require('url'),
  mongoose = require('mongoose'),
  uniqid = require('uniqid'),
  bodyParser = require('body-parser'),
  GameState = require('./lib/game_state.js')

var app = express(),
  server = http.Server(app),
  io = socket(server)

var GameStateLib = require('./lib/game_state.js')

server.listen(3000)
mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost/scrabble')

app.use(express.static('public'))
app.use('/join', express.static('public'))
app.use(bodyParser.json())

var db = mongoose.connection
var Game
var roomClientMap = new Map()

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
  var playerSchema = new mongoose.Schema(
    {
      id: String,
      name: String,
      status: String
    },
    { _id: false }
  )
  var gameSchema = new mongoose.Schema({
    roomId: String,
    player1: playerSchema,
    player2: playerSchema
  })

  gameSchema.statics.findByRoomId = function(room) {
    return this.findOne({ roomId: room })
  }

  gameSchema.methods.findPlayer = function(player) {
    return this.findOne({ players: { $in: [player] } })
  }

  Game = mongoose.model('Game', gameSchema)
})

app.post('/start', function(req, res) {
  console.log('Start received')
  var pid = uniqid(),
    roomId = uniqid(),
    player1 = {
      id: pid + '-0',
      name: req.body.name,
      status: 'Joined'
    },
    player2 = {
      id: pid + '-1',
      name: 'NULL',
      status: 'Open'
    }

  Game.create(
    {
      roomId: roomId,
      player1: player1,
      player2: player2
    },
    (err, game) => {
      console.log('Created room: ' + game.roomId)
      var data = {
        roomId: game.roomId,
        _id: game._id
      }
      res.send(data)
    }
  )
  roomClientMap.set(roomId, [])
})

app.post('/join', function(req, res) {
  console.log('Attempting to joing room: ' + req.body.room)
  var pid = uniqid() + '-1',
    player,
    pidx

  Game.findByRoomId(req.body.room).exec((err, game) => {
    if (err || !game) {
      res.status(400).send({
        code: 'roomNotFound',
        message: 'Failed to find the expected game room'
      })
    } else {
      console.log('room found')
      console.log('success')
      player = {
        id: pid,
        name: req.body.name,
        status: 'Joined'
      }

      console.log('successfully joined room')
      var gameFound = false
      if (game.player2.status == 'Open') {
        game.player2 = player
        game.save()
        var data = {
          _id: game._id,
          roomId: game.roomId,
          //player: pid,
          username: req.body.name
        }
        res.send(data)
      } else {
        res.status(400).send({
          code: 'gameFull',
          message: 'All available player slots have been filled'
        })
      }
    }
  })
})

var clients = []
var players = []
var spectators = []
var GameState

var numRooms = 0
var rooms = {}
var gameInstances = new Map()

io.sockets.on('connection', function(socket) {
  socket.on('join', data => {
    roomClientMap.get(data.roomId).push(socket)
    Game.findOne({ _id: data._id }, (err, game) => {
      if (err || !game) {
        console.log('Could not find room for socket')
      } else {
        var room = game.roomId
        var pCount = 0
        console.log('socket connected to room: ' + room)
        socket.join(room)
        if (
          game.player1.status == 'Joined' &&
          game.player2.status == 'Joined'
        ) {
          var GameStateInstance = GameState(io, room, roomClientMap.get(room))
          GameStateInstance.startGame()
          gameInstances.set(room, GameStateInstance)
        }
      }
    })
  })

  socket.on('endPress', function(data) {
    if (gameInstances.has(data.roomId))
      gameInstances.get(data.roomId).switchTurns()
  })
})
