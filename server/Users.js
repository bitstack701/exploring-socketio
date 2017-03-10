const {getUserByUsername, getUserById, getUserBySocketId} = require('./UserData')
const { updateLastSeen} = require('./Utils')
const log = require('debug')('bitstack:server:users')

/**
 *
 */
module.exports = ({io, socketMap, userMap}) => {
  io.on('connection', (socket) => {
    const socketId = socket.id

    socket.on('login', ({username}, cb) => {
      log(`User ${username} has logged in socket.id: ${socketId}`)
      const user = getUserByUsername(username)
      if (user) {
        user.lastSeen = Date.now()
        user.socketId = socketId
        userMap[user.userId] = user
        socket.broadcast.emit('user logged in', {user})
        socketMap[socketId].userId = user.userId

        cb(null, {user})
      } else {
        const err = {
          code: "1",
          message: `Could not find a user with the username ${username}`
        }
        log(err.message)
        cb(err, null)
      }
    })

    socket.on('logout', ({userId}) => {
      const user = getUserById(userId)
      const {username} = user
      log(`User ${username} has logged out`)
      socket.broadcast.emit('user logged out', {user})
      delete userMap[userId]
    })

    socket.on('who is online', (cb) => {
      const loggedInUser = getUserBySocketId(socketId)
      const onlineUsers = Object.keys(userMap)
        .map(userId => userMap[userId])
        .filter(u => !loggedInUser || u.userId !== loggedInUser.userId) // don't include the user who is asking
      cb(null, onlineUsers)

      // There might be nobody logged on...
      // At a later stage we only want to do all these things after the user has logged in
      if (loggedInUser) {
        updateLastSeen({userId: loggedInUser.userId, socket})
      }
    })

  })
}
