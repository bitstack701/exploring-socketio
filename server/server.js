// configure the .env config file
require('dotenv').config()

const Rx = require('rxjs/Rx')
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const log = require('debug')('bitstack:server')

const redisHost = process.env.REDIS_HOST || 'localhost'
const redisPort = process.env.REDIS_PORT || 6379
const redis = require('socket.io-redis');
log(`Connecting to redis ${redisHost}:${redisPort}`)
io.adapter(redis({host: redisHost, port: redisPort}));

// Express only serves static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));

  // turn on server side logging run now-logs bitstack:exploring-socketio
  // see https://www.npmjs.com/package/now-logs for more info
  require('now-logs')('bitstack:exploring-socketio')
}

const userMap = {}
const socketMap = {}

app.get('/', function (req, res) {
  res.send('<h1>Hello</h1>')
})

app.get('/sockets', function (req, res) {
  io.of('/').adapter.clients((err, clients) => {
    res.json(clients)
  })
})

process.on('SIGINT', function () {
  console.log('Server going down SIGINT');
  process.exit(0)
})

process.on('SIGTERM', function () {
  console.log('Server going down SIGTERM');
})

process.on('exit', function () {
  console.log('Server going down exit');
})


process.on('uncaughtException', function (err) {
  console.log('Server going down uncaughtException');
  console.log(err)     
});


/*
const allSocketsRequest = Rx.Observable.create((observer) => {
  app.get('/sockets', function (req, res) {
    observer.next({req, res})
  })
})
const getAllSockets = Rx.Observable.create((observer) => {
  io.of('/').adapter.clients((err, clients) => {
    observer.next({clients})
  })
})

Rx.Observable.combineLatest(allSocketsRequest, getAllSockets, ({req, res}, {clients}) => {
  log(clients)
  res.json(clients)
}).subscribe()
*/

/*
allSocketsRequest.subscribe(({req, res}) => {
  res.json(socketMap)
})
*/


app.get('/users/list', function (req, res) {
  res.json(userMap)
})

app.get('/rooms', function (req, res) {
  io.of('/').adapter.allRooms((err, rooms) => {
    res.json(rooms)
  })
})

require('./Sockets')({io, socketMap, userMap})
require('./Users')({io, socketMap, userMap})
require('./Messages')({io, socketMap, userMap})
require('./Rooms')({io, socketMap, userMap})

let port = process.env.port || 3005
http.listen(port, function () {
  log(`listening on port localhost:${port}`);
})