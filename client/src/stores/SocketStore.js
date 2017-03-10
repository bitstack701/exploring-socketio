import {observable, extendObservable, action} from "mobx";
import debug from 'debug'

const log = debug('bitstack:stores:socketStore')

/**
 * Make socket info available through the store.
 */
module.exports.createSocketStore = ({socket, store}) => {
  extendObservable(store, {
    allSockets: observable.map({}),
    socket: {
      socketId: undefined,
      status: 'Connecting'
    }
  })

  socket.on('connect', action(() => {
    log('My socket connected', socket.id)
    store.socket.socketId = socket.id
    store.socket.status = 'Connected'
  }))

  // this is when our own socket disconnects
  socket.on('disconnected', action(() => {
    log('Our socket has been disconnected')
    store.socket.status = 'Disconnected'
  }))

  socket.on('reconnecting', action(() => {
    store.socket.status = 'Reconnecting'
  }))

  // this is the server telling us that a socket has connected
  socket.on('socket connected', action(({ socketId, connectedTime, userId }) => {
    log('The server says a socket connected', { socketId, connectedTime, userId })
    store.allSockets.set(socketId, { socketId, connectedTime, userId })
  }))

  // this is the server telling us that a socket has disconnected
  socket.on('socket disconnected', action(({socketId}) => {
    // We need to refresh other rooms in case that they were the last person in the room
    store.loadOtherRooms()

    const socketDetails = store.allSockets.get(socketId)
    if (socketDetails) {
      const { userId } = socketDetails
      if (userId) {
        const u = store.otherUsers.get(userId)
        if (u) {
          log(`User ${u.username} has disconnected`)
          u.socketId = undefined
        }
      }
      store.allSockets.delete(socketId)
    }
  }))

  store.initAllSockets = action((next) => {
    // ask the server what sockets are already there
    store.allSockets.clear()
    socket.emit('allSockets', action((err, allSockets) => {
      log('Loading a list of all the sockets', allSockets)
      allSockets.forEach(s => {
        const {socketId, connectedTime, userId} = s
        store.allSockets.set(s.socketId, {socketId, connectedTime, userId})
      })

      if (next) next()
    }))
  })
}