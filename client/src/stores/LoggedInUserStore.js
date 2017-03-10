import {observable, extendObservable, action, toJS} from "mobx";
import debug from 'debug'

import LocalStorage from './LocalStorage'
const log = debug('bitstack:stores:loggedInUserStore')

/**
 *
 */
module.exports.createLoggedInUserStore = ({socket, store}) => {
  extendObservable(store, {
    loginError: undefined,
    loginInProgress: false,
    loggedInUser: {
      userId: undefined,
      username: undefined,
      profilePic: undefined
    }
  })

  // helper method to link the socket to a user - called after a user is logged in
  function linkSocketWithUser({socketId, userId}) {
    const {allSockets} = store;
    const currVal = allSockets.get(socketId)
    if (currVal) {
      log('Linking socket with user', socketId, userId)
      allSockets.set(socketId, extendObservable(currVal, {userId})) // link our socket with us
    } else {
      log('Error linking socket with user could not find a my socket on the map', socketId, allSockets)
    }
  }

  store.login = action('Login start', (params) => {
    store.loginInProgress = true
    log(`User ${params.username} logging in start`)
    socket.emit('login', {username: params.username}, action('Login end', (err, res) => {
      if (!err) {
        const {userId, username, profilePic} = res.user
        log(`User ${username} login complete`, res)
        store.loggedInUser = observable({userId, username, profilePic})
        store.loginError = undefined

        linkSocketWithUser({socketId: socket.id, userId})

        LocalStorage.saveUser(toJS(store.loggedInUser))
      } else {
        log(`User ${params.username} login completed with an error ${err.message}`)
        store.loginError = err
      }
      store.loginInProgress = false
    }))
  })

  store.logout = action('Logout', () => {
    const {userId} = store.loggedInUser
    socket.emit('logout', {userId})
    LocalStorage.clearUser()
    store.loggedInUser = {}
    store.allSockets.get(socket.id).userId = undefined
  })

  store.tryLoadUserFromLocalStorage = action(() => {
    const userFromLocalStorage = LocalStorage.loadUser()
    if (userFromLocalStorage) {
      userFromLocalStorage.socketId = store.socket.socketId
      store.loggedInUser = userFromLocalStorage

      const {username} = userFromLocalStorage
      if (username) {
        store.login({username})
      }
    }
  })
}