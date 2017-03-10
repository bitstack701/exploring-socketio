const userDB = {
  1: {userId: 1, username: 'Jon', profilePic: '/profiles/user1m.png'},
  2: {userId: 2, username: 'Lara', profilePic: '/profiles/user2f.jpg'},
  3: {userId: 3, username: 'Mike', profilePic: '/profiles/user3m.jpg'},
  4: {userId: 4, username: 'Dave', profilePic: '/profiles/user4m.jpg'},
}

module.exports.getUserById = (userId) => {
  return userDB[userId]
}

module.exports.getUserBySocketId = (socketId) => {
  const key = Object.keys(userDB).find(k => userDB[k].socketId === socketId)
  return userDB[key]
}

module.exports.getUserByUsername = (username) => {
  let ans = undefined
  Object.keys(userDB).forEach(k => {
    if (userDB[k].username.toLocaleLowerCase() === username.toLowerCase()) ans = userDB[k]
  })
  return ans
}