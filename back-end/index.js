
const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

let users = {}
app.use('/', express.static(path.join(__dirname, '/../front-end/')))



io.on("connection", (socket) => {

  try {
    console.log(socket.id, " connected")
    users[socket.id] = ""
    socket.on('user-data', (data) => {
      users[socket.id] = data
      io.emit('users', users)

    })

    socket.on('offer', (data) => {
      // socket.broadcast.emit('offer', data)
      data.sender=socket.id
      io.to(data.member).emit('offer',data)
    })

    socket.on('answer', (data) => {
      // socket.broadcast.emit('answer', data)
      io.to(data.receiver).emit('answer',data)
    })

    socket.on('candidate', (data) => {
      socket.broadcast.emit('candidate', data)
    })

    socket.on('get-users', async (data) => {

      io.emit('users', users)
    })

    socket.on("disconnect", (reason) => {
      // ...
      delete users[socket.id]
      io.emit('users',users)
    });

    socket.on('call',(id)=>{
      console.log('call...',id)
      io.to(id).emit('incoming-call',socket.id)
    })

    socket.on('deny-call',(data)=>{
      console.log('deny-call',data,socket.id)
      io.to(data.member).emit('deny-call',data)
    })

    socket.on('webrtc-connected',(data)=>{
      console.log('webrtc-connected',data,socket.id)
      io.to(data.member).emit('webtrc-connected',{member:socket.id})
    })
  } catch (error) {
    console.log(error)
  }
});

// io.listen(3000);
// console.log('server is running ')
server.listen(3000, () => {
  console.log('listening on *:3000');
});