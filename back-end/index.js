
const io = require("socket.io")();

let users = {}

io.on("connection", (socket) => {

  try {
    console.log(socket.id, " connected")
    users[socket.id] = ""
    socket.on('user-data', (data) => {
      users[socket.id] = data
      io.emit('users', users)

    })

    socket.on('offer', (data) => {
      socket.broadcast.emit('offer', data)
    })

    socket.on('answer', (data) => {
      socket.broadcast.emit('answer', data)
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
  } catch (error) {
    console.log(error)
  }
});

io.listen(3000);