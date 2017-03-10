import React  from 'react';
import io from 'socket.io-client'
import debug from 'debug'
import {inject, observer, Provider} from 'mobx-react'

const log = debug('bitstack:App')

import {createStore} from './stores/Store'
import ConnectionStatus from './connectionStatus/ConnectionStatus'

const App = React.createClass({

  getInitialState() {
    return {
      socket: undefined,
      store: undefined
    }
  },

  componentWillMount() {
    let socket = io()
    const store = createStore({socket})
    this.setState({socket: socket, store})
  },

  render() {
    const {socket, store} = this.state

    let view = <div>Loading</div>
    if (socket) {
      view =
        <Provider store={store} socket={socket}>
          <div>
            <Main/>
            <ConnectionStatus/>
          </div>
        </Provider>
    }
    return view
  }
})

const Main = inject('store')(observer(React.createClass({

  render() {
    const {loggedInUser} = this.props.store

    let view = <div>Loading...</div>
    if (!loggedInUser.username) {
      view = <div>
        <Sockets/>
        <Login/>
      </div>
    } else {
      view =
        <div>
          <Sockets/>
          <Logout/>
          <SendMessage/>
          <Messages/>
          <OtherUsers/>
          <CreateRoom/>
          <MyRooms/>
          <OtherRooms/>
        </div>
    }
    return view
  }
})))

const Sockets = inject('store')(observer(React.createClass({
  render() {
    const { allSockets } = this.props.store
    const socketList = allSockets.values().map(s => {
      const { socketId, connectedTime, userId } = s
      return <div key={`socket-${socketId}`}>socketId: {socketId} connectedTime: {connectedTime} userId: {userId ? userId : 'none'}</div>
    })
    return <div>{socketList}</div>
  }
})))

const Login = inject('store')(observer(React.createClass({

  onKeyUp(e) {
    if (e.keyCode === 13) {
      const username = this.username.value
      log(`Enter pressed, user: ${username}`)
      const {store} = this.props
      store.login({username})
    }
  },

  render() {
    const {loginError} = this.props.store

    let error = null
    if (loginError) error = <h5>{loginError.message}</h5>

    return (
      <div>
        <h1>Login</h1>
        <input ref={me => this.username = me} type="text" placeholder="Username" onKeyUp={this.onKeyUp}/>
        {error}
      </div>
    )
  }
})))

const Logout = inject('store')(observer(React.createClass({

  logout() {
    this.props.store.logout()
  },

  render() {
    return (
      <div>
        <button onClick={this.logout}>Logout</button>
      </div>
    )
  }
})))

const CreateRoom = inject('store')(observer(React.createClass({

  onKeyUp(e) {
    if (e.keyCode === 13) {
      const roomName = this.roomName.value
      log(`Enter pressed, joining room: ${roomName}`)
      const {store} = this.props
      store.joinRoom({roomName})
    }
  },

  render() {
    return (
      <div>
        <h1>Create and join a room</h1>
        <input ref={me => this.roomName = me} type="text" placeholder="Room name" onKeyUp={this.onKeyUp}/>
      </div>
    )
  }
})))

const SendMessage = inject('store')(observer(React.createClass({

  keyPress(e) {
    const {store} = this.props

    if (e.keyCode === 13) {
      let message = this.message.value;
      log(`Enter pressed, sending message: ${message}`)
      store.sendMessage({message})
    } else {
      log('User is typing...')
    }
  },

  render() {
    const {loggedInUser, socket} = this.props.store
    const {username} = loggedInUser
    const {socketId} = socket

    return (
      <div>
        <h1>Hi {username} ({socketId})</h1>
        <p>Go on, send a message, you can do it!</p>
        <input ref={me => this.message = me} type="text" placeholder="Message" onKeyUp={this.keyPress}/>
      </div>
    )
  }
})))

const Messages = inject('store')(observer(React.createClass({

  render() {
    const {store} = this.props
    const {messages, loggedInUser} = store
    const {username} = loggedInUser
    const messageList = messages.map((m, i) => {
      const {sentByUserId, message} = m
      const sentBy = store.getUserById(sentByUserId)
      if (sentBy) {
        const saidByMe = username === sentBy.username
        return <div key={`message-${i}`}>{saidByMe ? 'You' : sentBy.username} said: {message}</div>
      } else {
        return null
      }
    })

    return (
      <div>
        <h1>Public Messages</h1>
        {messageList}
      </div>
    )
  }
})))

const MyRooms = inject('store')(observer(React.createClass({

  componentWillMount() {
    this.props.store.loadMyRooms()
  },

  leaveRoom(roomName) {
    this.props.store.leaveRoom({roomName})
  },

  render() {
    const {store} = this.props
    const { myRooms } = store
    const roomList = myRooms.map((room, i) => {
      const leaveButton = room !== 'Public' ? <button onClick={() => { this.leaveRoom(room) }}>Leave Room</button> : null
      return (
        <div key={`my-room-${i}`}>
          {room}
          {leaveButton}
        </div>
      )
    })

    return (
      <div>
        <h1>My Rooms <small>(rooms that I am in)</small></h1>
        {roomList}
      </div>
    )
  }
})))

// Rooms that I am not in
const OtherRooms = inject('store')(observer(React.createClass({

  componentWillMount() {
    this.props.store.loadOtherRooms()
  },

  render() {
    const {store} = this.props
    const { otherRooms } = store
    const roomList = otherRooms.map((room, i) => {
      return <div key={`other-room-${i}`}>{room}</div>
    })

    return (
      <div>
        <h1>Other Rooms <small>(Rooms that I am not in)</small></h1>
        {roomList}
      </div>
    )
  }
})))

const OtherUsers = inject('store')(observer(React.createClass({

  componentWillMount() {
      this.props.store.loadOtherUsers()
  },

  render() {
    const {otherUsers, loggedInUser} = this.props.store
    const userList = otherUsers.values().map((u, i) => {
      const {userId, username, lastSeenStr, socketId} = u
      const status = socketId ? "Connected" : "Disconnected"
      return <div key={`other-users-${userId}`}>{username} - {status} - {lastSeenStr}</div>
    })

    return (
      <div>
        <h1>Who is online?</h1>
        <div key={`other-users-${loggedInUser.userId}`}>{loggedInUser.username} (You)</div>
        {userList}
      </div>
    )
  }
})))

export default App;