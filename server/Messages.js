const log = require('debug')('bitstack:server:messages')
const { getUserById } = require('./UserData')
const { updateLastSeen} = require('./Utils')

/**
 *
 */
module.exports = ({io}) => {
  io.on('connection', (socket) => {

    // This is a user sending a message to everyone
    socket.on('sendMessage', ({sentByUserId, message}) => {
      const {userId, username} = getUserById(sentByUserId)
      log(`sendMessage userId: ${userId} username: ${username} message: ${message}`)
      socket.broadcast.emit('messageBroadcast', {sentByUserId: userId, message})
      updateLastSeen({userId, socket})
    })

  })
}
