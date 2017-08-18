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
    status: String,
    players: [playerSchema]
  })

  gameSchema.statics.findByRoomId = function(room) {
    return this.find({ roomId: room })
  }

  gameSchema.methods.findPlayer = function(player) {
    return this.find({ players: { $in: [player] } })
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
      console.log('Created room: ' + game.roomId)
      var data = game.toJSON()
      data.action = 'begin'
      data.player = pid + '-0'
      res.send(data)
    }
  )
})

app.post('/join', function(req, res) {
  console.log('Attempting to joing room: ' + req.query.room)
  var pid = uniqid(),
    player,
    pidx,
    game

  if (game = Game.findByRoomId(req.query.room)) {
    console.log('room found')
    console.log('success')
    player = {
      id: pid,
      name: req.body.name,
      status: 'joined'
    }

    game = Game.findOneAndUpdate(
      {
        _id: game._id,
        'players.status': { $in: ['Open'] }
      },
      {
        $set: { 'players.$': player }
      }
    )

    if (game) {
      console.log('successfully joined room')
      var data = {
        'action': 'join',
        'player': pid
      }

      res.sendFile('public/index.html', {root: __dirname })

    } else {
      res.send(400, {
        code: 'gameFull',
        message: 'All available player slots have been filled'
      })
    }
  } else {
    res.send(400, {
      code: 'roomNotFound',
      message: 'Failed to find the expected game room'
    })
  }
})

var clients = []
var players = []
var spectators = []
var GameState

var numRooms = 0
var rooms = {}

io.sockets.on('connection', function(socket) {
  var room, id, player

  socket.on('join', data => {
    Game.findByRoom(data.roomId, (err, game) => {
      var playerCount = 0,
        containsPlayer

      if (game) {
        id = game._id
        room = game.roomId
        player = data.player

        pdata = game.findPlayer(player)

        if (pdata.toArray().length > 1) {
          console.log('Error: multiple games with the same player')
        }

        if (pdata) {
          console.log('socket connected to room: ' + room)
          socket.join(room)
          io.sockets.in(room).emit('joined')

          game.players.forEach(p => {
            if (p.status == 'joined') playerCount++
          })

          if (playerCount == NUM_REQUIRED_PLAYERS) {
            game.save((err, game) => {
              io.sockets.in(room).emit('ready')
            })
          }
        }
      }
    })
  })

  console.log('new connection: ' + socket.id)
  clients.push(socket)
  if (clients.length == 2) {
    GameState = require('./lib/game_state.js')(io, clients)
    GameState.startGame()
  }

  socket.on('endPress', function(data) {
    GameState.switchTurns()
  })
})
