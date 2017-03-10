import React from 'react'
import { inject, observer } from 'mobx-react'

const ConnectionStatus = inject('store')(observer(({store}) => {
  const { socket } = store
  const { status } = socket

  let color = '#9b9b9b'
  if (status !== 'Connected') color = '#b40615'

  const style = {
    position: 'fixed',
    bottom: 0,
    right: 0,
    margin: 10,
    padding: 5,
    fontSize: 12,
    color
  }
  return <div style={style}>{status}</div>
}))

export default ConnectionStatus
