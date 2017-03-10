import {observable, extendObservable, action} from "mobx";
import debug from 'debug'
import moment from 'moment'

const log = debug('bitstack:stores:usersStore')

/**
 *
 */
module.exports.createUsersStore = ({socket, store}) => {
  extendObservable(store, {
    otherUsers: observable.map({}),
  })

  store.loadOtherUsers = action(() => {
    socket.emit('who is online', action((err, userList) => {
      userList.forEach(u => {
        store.updateUsersLastSeenStr(u)
        store.otherUsers.set(u.userId, u)
      })
    }))
  })

  // The server is telling us someone has logged in
  socket.on('user logged in', action(({user}) => {
    const {userId, username, socketId} = user
    log('user logged in', userId, username)
    store.updateUsersLastSeenStr(user)
    store.otherUsers.set(userId, user)

    const socketDetails = store.allSockets.get(socketId)
    if (socketDetails) {
      store.allSockets.get(socketId).userId = user.userId
    }
  }))

  // The server is telling us someone has logged out
  socket.on('user logged out', action(({user}) => {
    const {userId, username} = user
    log('user logged out', userId, username)
    store.otherUsers.delete(userId)
    store.allSockets.get(user.socketId).userId = undefined
  }))

  // Setup a timer to updated the users lastSeenStr every 30 sec
  setInterval(action(() => {
    store.otherUsers.values().forEach(user => {
      user.lastSeenStr = moment(user.lastSeen).fromNow()
    })
  }), 1000 * 30)

}