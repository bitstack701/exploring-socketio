const {getUserBySocketId} = require('./UserData')
const { updateLastSeen} = require('./Utils')
const log = require('debug')('bitstack:server:rooms')
const Rx = require('rxjs/Rx')

/**
 *
 */
module.exports = ({io, socketMap}) => {
  io.on('connection', (socket) => {
    const socketId = socket.id

    socket.on('allRooms', (cb) => {
      log(`[${socketId}] wants a list of all the rooms`)
      io.of('/').adapter.allRooms((err, rooms) => {
        // We don't want to give back rooms which are session ids because these are the
        // default rooms which enable direct messages
        cb(err, rooms.filter(room => !socketMap[room]))
      })

      // There might be nobody logged on...
      // At a later stage we only want to do all these things after the user has logged in
      const user = getUserBySocketId(socketId)
      if (user) {
        updateLastSeen({userId: user.userId, socket})
      }
    })

    const allRoomsStream = Rx.Observable.create((observer) => {
      io.of('/').adapter.allRooms((err, rooms) => {
        if (err) {
          observer.error(err)
        } else {
          // We don't want to give back rooms which are session ids because these are the
          // default rooms which enable direct messages
          observer.next(rooms.filter(room => !socketMap[room]))
          observer.complete()
        }
      })
    })

    const myRoomStream = Rx.Observable.create((observer) => {
      io.of('/').adapter.clientRooms(socketId, (err, rooms) => {
        if (err) {
          observer.error(err)
        } else {
          // We don't want to give back rooms which are session ids because these are the
          // default rooms which enable direct messages
          observer.next(rooms)
          observer.complete()
        }
      })
    })

    // get a list of all the rooms that I am not in
    socket.on('other rooms', (cb) => {
      log(`[${socketId}] wants a list of the other rooms i.e. rooms that they are not in...`)

      Rx.Observable.combineLatest(myRoomStream, allRoomsStream, (my, all) => {
        return all.filter(r => my.indexOf(r) === -1)
      })
      .subscribe(otherRooms => {
        cb(null, otherRooms)
      }, err => cb(err, null))
    })

    // get all the rooms for a particular socket
    socket.on('my rooms', (cb) => {
      io.of('/').adapter.clientRooms(socketId, (err, rooms) => {
        cb(err, rooms.filter(room => !socketMap[room]))
      })
    })

    // get all the sockets in a room
    socket.on('who is in room', ({room}, cb) => {
      io.in(room).clients((err, clients) => {
        cb(err, clients)
      })
    })

    socket.on('join room', ({roomName}) => {
      const {userId, username} = getUserBySocketId(socketId)
      log(`getUserBySocketId(socketId) = ${getUserBySocketId(socketId)}`)
      log(`[${socketId} - ${username}] has joined the room ${roomName}`)
      socket.join(roomName)
      socket.broadcast.emit('user joined a room', {username, roomName})
      updateLastSeen({userId, socket})
    })

    socket.on('leave room', ({roomName}) => {
      const {userId, username} = getUserBySocketId(socketId)
      log(`[${socketId} - ${username}] has left the room ${roomName}`)
      socket.leave(roomName)
      socket.broadcast.emit('user left a room', {username, roomName})
      updateLastSeen({userId, socket})
    })
  })
}
