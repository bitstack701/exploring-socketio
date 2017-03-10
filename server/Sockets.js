const {getUserBySocketId} = require('./UserData')
const log = require('debug')('bitstack:server:sockets')

/**
 *
 */
module.exports = ({io, socketMap, userMap}) => {
  io.on('connection', (socket) => {
    const socketId = socket.id
    log(`A socket connected socket.id: ${socketId}`)
    socketMap[socketId] = { socketId, connectedTime: Date.now(), userId: undefined }
    socket.broadcast.emit('socket connected', socketMap[socketId])

    socket.on('disconnect', () => {
      const user = getUserBySocketId(socketId)
      if (user) {
        const {userId, username} = user
        delete userMap[userId]
        log(`A user disconnect socket.id: ${socketId} ${username}`)
      }
      log(`A socket disconnected`)
      delete socketMap[socketId]
      socket.broadcast.emit('socket disconnected', {socketId})
    })

    socket.on('allSockets', (cb) => {
      const connectedSockets = []
      Object.keys(socketMap).forEach(k => {
        connectedSockets.push(socketMap[k])
      })
      cb(null, connectedSockets)
    })

    socket.on('allSockets2', (cb) => {
      io.of('/').adapter.clients((err, clients) => {
        cb(null, clients)
      })
    })
  })
}
