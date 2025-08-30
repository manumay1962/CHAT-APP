import express from 'express';
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from './lib/db.js';
import userRouter from './Routes/userRoutes.js';
import messageRouter from './Routes/messageRoutes.js';
import { Server } from "socket.io";

//create express app and http server
const app = express();
const server = http.createServer(app);

//socket.io server
export const io = new Server(server, {
  cors: { origin: '*' }
});

//store online users
export const userSocketMap = {};

//io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;

  //emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ✅ listen for messages from clients
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    console.log("Message received:", { senderId, receiverId, text });

    // save to DB (optional: you probably already do this in messageRouter)
    // const newMsg = await Message.create({ senderId, receiverId, text });

    // find receiver socket
    const receiverSocketId = userSocketMap[receiverId];

    if (receiverSocketId) {
      // ✅ emit to receiver in real-time
      io.to(receiverSocketId).emit("newMessage", {
        senderId,
        text,
        createdAt: new Date()
      });
    }
  });

  // handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

//middleware
app.use(express.json({ limit: "4mb" }));
app.use(cors());

app.use("/api/status", (req, res) => res.send("Server is running"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

//db connection
await connectDB();

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server is running on PORT:${PORT}`);
  });
}

//export server for vercel
export default server;
