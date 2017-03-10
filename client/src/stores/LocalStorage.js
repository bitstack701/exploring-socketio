import LocalStorage from 'local-storage'
import debug from 'debug'

const log = debug('bitstack:localStorage')

const loggedInUserKey = "bitstack:loginStore:loggedOnUser"

module.exports.loadUser = () => {
  const fromLocalStorage = LocalStorage.get(loggedInUserKey)
  if (fromLocalStorage) {
    log('Loaded a user from local storage', fromLocalStorage)
    return JSON.parse(fromLocalStorage)
  }
}

module.exports.saveUser = (user) => {
  if (user) {
    log(`Saved user ${user.username} to local storage`)
    LocalStorage.set(loggedInUserKey, JSON.stringify(user))
  } else {
    log('Removed a user from local storage')
    LocalStorage.remove(loggedInUserKey)
  }
}

module.exports.clearUser = () => {
  log('Removed a user from local storage')
  LocalStorage.remove(loggedInUserKey)
}