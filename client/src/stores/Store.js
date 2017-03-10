import {observable, action, toJS} from "mobx";
import debug from 'debug'
import moment from 'moment'

import { createSocketStore } from './SocketStore'
import { createLoggedInUserStore } from './LoggedInUserStore'
import { createUsersStore } from './UsersStore'
import { createMessageStore } from './MessageStore'
import { createRoomStore } from './RoomStore'

const log = debug('bitstack:store')
module.exports.createStore = ({socket}) => {
  let store = observable({

    getUserById(userId) {
      let ans = undefined
      if (this.loggedInUser.userId === userId) {
        ans = this.loggedInUser
      } else {
        ans = this.otherUsers.get(userId)
      }
      return ans
    },

    // used to update the users lastSeenStr
    updateUsersLastSeenStr(user) {
      if (user) {
        user.lastSeen = Date.now()
        user.lastSeenStr = moment(user.lastSeen).fromNow()
      }
    }
  })

  createSocketStore({socket, store})
  createLoggedInUserStore({socket, store})
  createUsersStore({socket, store})
  createRoomStore({socket, store})
  createMessageStore({socket, store})

  /*
  * This is when our own socket connects
  * Sync all sockets with server
  * If there is a user in local storage log them in
  */
  socket.on('connect', action(() => {
    log('My socket connected', socket.id)
    store.initAllSockets(store.tryLoadUserFromLocalStorage)
  }))

  socket.on('update last seen', action(({userId}) => {
    const u = store.getUserById(userId)
    store.updateUsersLastSeenStr(u)
  }))

  socket.on('notification', action(({message}) => {
    log(`Received a notification ${message}`)
  }))

  window.toJS = toJS
  window.rootStore = store
  return store
}

