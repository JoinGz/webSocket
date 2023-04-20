import { createServer } from 'http'
import { Server } from 'socket.io' // 4.6.1

const httpServer = createServer()

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:52330',
  },
})

const clients = {} // 保存所有已注册的客户端

function isValid(socket) {
  console.log(socket.handshake?.auth?.token, socket.id)
  return socket.handshake?.auth?.token
}

io.use((socket, next) => {
  if (isValid(socket)) {
    next()
  } else {
    next(new Error('not authorized'))
  }
})

io.on('connection', (socket) => {
  // 监听客户端的身份验证响应事件
  socket.on('register', (data) => {
    if (data && data.success === true) {
      // 客户端注册事件
      const client_id = data.client_id
      clients[client_id] = socket

      console.log(`Client ${client_id} registered.`)
      console.log('a user register')
    } else {
      console.log('a user failed to authenticate')
      socket.disconnect()
    }
  })

  socket.on('message', (data) => {
    console.log(`收到消息: ${data}`)
  })

  socket.on('over', (data) => {
    console.log(`over收到消息: ${JSON.stringify(data)}`)
    const { client_id } = data
    if (clients[client_id]) {
      clients[client_id].emit('flash')
    }
  })

  socket.on('error', (err) => {
    if (err && err.message === 'unauthorized event') {
      socket.disconnect()
    }
  })

  // 断开连接时移除客户端信息
  socket.on('disconnect', () => {
    const client_id = socket.id
    delete clients[client_id]
    console.log(`Client ${client_id} unregistered.`)
  })
})

io.listen(3000)
