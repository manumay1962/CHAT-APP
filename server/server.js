import express from 'express';
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from './lib/db.js';
import userRouter from './Routes/userRoutes.js';


//create express app and ghttp server
const app = express();
const server = http.createServer(app);

//middleware
app.use(express.json({limit:"4mb"}));
app.use(cors());

app.use("/api/status",(req,res)=>res.send("Server is running"));
app.use("/api/auth",userRouter)

//db connection
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT,()=> {
    console.log(`Server is running on PORT:${PORT}`);
    
})