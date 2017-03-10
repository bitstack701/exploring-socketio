import {extendObservable, action} from "mobx";
import debug from 'debug'

const log = debug('bitstack:stores:messageStore')

/**
 *
 */
module.exports.createMessageStore = ({socket, store}) => {
  extendObservable(store, {
    messages: [],
  })

  // This is the loggedInUser sending messages to other people
  store.sendMessage = action('Send message start', ({message}) => {
    const {userId} = store.loggedInUser
    const payload = {sentByUserId: userId, message};
    store.messages.push(payload)
    socket.emit("sendMessage", payload)
  })

  // This is the server sending us other peoples messages
  socket.on('messageBroadcast', action((payload) => {
    const {sentByUserId} = payload
    log('Received a message from the server', payload)
    const sentBy = store.otherUsers.get(sentByUserId)
    if (sentBy) {
      store.messages.push(payload)
    }
  }))
}