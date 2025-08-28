import express from 'express';
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from './lib/db.js';
import userRouter from './Routes/userRoutes.js';
import messageRouter from './Routes/messageRoutes.js';
import {Server} from "socket.io"

//create express app and ghttp server
const app = express();
const server = http.createServer(app);

//socket.io server
export const io = new Server(server,{
    cors:{origin:'*'}
})
//store online users
export const userSocketMap = {};
//io connection handler
io.on("connection", (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("user coneected",userId);
    
    if(userId) userSocketMap[userId] = socket.id;
    //emit online user to all coneected client

    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    socket.on("disconnected",()=>{
        console.log("user disconnected",userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap))
        
    })

})

//middleware
app.use(express.json({limit:"4mb"}));
app.use(cors());

app.use("/api/status",(req,res)=>res.send("Server is running"));
app.use("/api/auth",userRouter);
app.use("/api/messages",messageRouter);

//db connection
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT,()=> {
    console.log(`Server is running on PORT:${PORT}`);
    
})