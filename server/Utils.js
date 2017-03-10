

module.exports.updateLastSeen = ({userId, socket}) => {
  socket.broadcast.emit('update last seen', {userId})
}
