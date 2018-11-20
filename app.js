// server.js文件
const express = require('express')
const app = express()
// 设置静态文件夹
app.use(express.static(__dirname))
// 通过node的http模块来创建一个server服务
const server = require('http').createServer(app)
// WebSocket是依赖HTTP协议进行握手的
const io = require('socket.io')(server)
// 用来保存对应的socket，就是记录对方的socket实例(私聊时用)
let socketObj = {}
// 监听与客户端的连接事件
io.on('connection', socket => {
  console.log('服务端连接成功')
  let username
  // socket 会生成这个对象。
  // 处理客户端传来的函数名，值
  socket.on('message', msg => {
    if (username) {
      // 判断是否为私聊
      let private = msg.match(/@([^ ]+) (.+)/)
      // console.log(private)
      if (private) {
        let privateUser = private[1]
        let msg = private[2]
        let socketUser = socketObj[privateUser]
        if (socketUser) {
          // console.log('用户存在')
          // 要去官网查询下API，只有@的人可以看见，自己都看不见自己说的话了
          socketUser.emit('allMsg',{
            user: username,
            msg,
            createAt: new Date().toLocaleString()
          })
        }
      } else {
        // io.emit()方法是向大厅和所有人房间内的人广播
        // 接收到用户发送的消息，向全全广播
        io.emit('allMsg', {
          user: username,
          msg,
          createAt: new Date().toLocaleString()
        })
      }
    } else {
      username = msg
      // ☆️ socket.broadcast.emit，这个方法是向除了自己外的所有人广播
      socket.broadcast.emit('userJoin', {
        user: username,
        msg,
        createAt: new Date().toLocaleString()
      })
      socketObj[username] = socket
    }
  })
})

// 监听3000端口
// ☆ 这里要用server去监听端口，而非app.listen去监听(不然找不到socket.io.js文件)
server.listen(3000, () => {
  console.log(`let's go!`)
})
