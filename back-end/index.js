const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, { cors: {
    origin: "http://localhost:5500"
  }});

io.on("connection", (socket) => {


  console.log(socket.id, " connected")

  socket.on('offer',(data)=>{
    socket.broadcast.emit('offer',data)
  })

  socket.on('answer',(data)=>{
    socket.broadcast.emit('answer',data)
  })

  socket.on('candidate',(data)=>{
    socket.broadcast.emit('candidate',data)
  })
});

httpServer.listen(3000);