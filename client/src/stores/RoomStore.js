import {extendObservable, action} from "mobx";
import debug from 'debug'
import Rx from 'rxjs/Rx'

const log = debug('bitstack:stores:roomStore')

/**
 * Room management.
 * What rooms are available.
 * Join a room.
 * What rooms am I in.
 * Who is in room xyz?
 */
module.exports.createRoomStore = ({socket, store}) => {
  extendObservable(store, {
    myRooms: ["Public"],
    otherRooms: []
  })

  // Load all the rooms I am in
  store.loadMyRooms = action(() => {
    socket.emit('my rooms', action((err, rooms) => {
      log(`Received my rooms from the server rooms: ${rooms}`)
      store.myRooms = store.myRooms.concat(rooms)
    }))
  })

  // Load all the other rooms
  store.loadOtherRooms = action(() => {
    socket.emit('other rooms', action((err, rooms) => {
      log(`Received other rooms from the server rooms: ${rooms}`)
      store.otherRooms = rooms
    }))
  })

  store.joinRoom = action('Join room start', ({roomName}) => {
    store.myRooms.push(roomName)
    socket.emit('join room', {roomName})
  })

  store.leaveRoom = action('Leave room start', ({roomName}) => {
    log(`Leaving room ${roomName}`)
    store.otherRooms = store.otherRooms.filter(r => r !== roomName)
    store.myRooms = store.myRooms.filter(r => r !== roomName)
    socket.emit('leave room', {roomName})
  })

  socket.on('user joined a room', action(({username, roomName}) => {
    log(`User ${username} has joined the room ${roomName}`)
    if (store.otherRooms.indexOf(roomName) === -1) {
      log(`The room ${roomName} is not in my list of other rooms, adding it`)
      store.otherRooms.push(roomName)
    }
  }))

  // Here we are grouping all the events which require us to fetch other rooms from the server together
  const socketDisconnected = Rx.Observable.fromEvent(socket, 'socket disconnected')
  const userLeftRoom = Rx.Observable.fromEvent(socket, 'user left a room')
  const userLoggedOut = Rx.Observable.fromEvent(socket, 'user logged out')
  Rx.Observable.merge(socketDisconnected, userLeftRoom, userLoggedOut)
    .subscribe(() => {
      store.loadOtherRooms()
    }, err => console.error(err))

  return store
}