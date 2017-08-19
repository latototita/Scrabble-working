const NUM_REQUIRED_PLAYERS = 2

var express = require('express'),
  socket = require('socket.io'),
  fs = require('fs'),
  http = require('http'),
  url = require('url'),
  mongoose = require('mongoose'),
  uniqid = require('uniqid'),
  bodyParser = require('body-parser')

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
    players: [playerSchema]
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
    players = [
      {
        id: pid + '-0',
        name: req.body.name,
        status: 'connected'
      },
      {
        id: pid + '-1',
        name: 'NULL',
        status: 'Open'
      }
    ]

  Game.create(
    {
      roomId: roomId,
      players: players
    },
    (err, game) => {
      console.log('Created room: ' + game.roomId)
      var data = game.toJSON()
      data.action = 'begin'
      data.player = pid + '-0'
      res.send(data)
    }
  )
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

      Game.findOneAndUpdate(
        { _id: game._id },
        { players: { $elemMatch: { status: 'Open' } } },
        (err, _game) => {
          if (_game) {
            console.log('successfully joined room')

            for (p = 0; p < NUM_REQUIRED_PLAYERS; p++) {
              if (_game.players[p].status == 'Open') {
                console.log('SDFASDFASDF')
                _game.players[p] = player
              }
            }
            console.log(_game)
            var data = {
              _id: _game._id,
              player: pid,
              username: req.body.name
            }
            console.log(data)
            res.send(data)
          } else {
            res.status(400).send({
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
var gameInstances = new Map()

io.sockets.on('connection', function(socket) {
  socket.on('join', data => {
    Game.findOne({ _id: data._id }).exec((err, game) => {
      if (err || !game) {
        console.log('Could not find room for socket')
      } else {
        var room = game.roomId
        console.log('socket connected to room: ' + room)
        socket.join(room)
        GameState = require('./lib/game_state.js')(io, clients)
        GameState.startGame()
        gameInstances.set(room, GameState)
      }
    })
  })

  socket.on('endPress', function(data) {
    GameState.switchTurns()
  })
})
/*
  console.log('new connection: ' + socket.id)
  clients.push(socket)
  if (clients.length == 2) {
    GameState = require('./lib/game_state.js')(io, clients)
    GameState.startGame()
  }
*/
