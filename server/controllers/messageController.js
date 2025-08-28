import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io,userSocketMap } from "../server.js";




export const getUsersForSideBar = async (req,res)=>{
    try {
        
         const userId = req.user._id;
         const filteredUsers = await User.find({_id:{$ne:userId}}).select("-password");


         //not seen messagegs
         const unseenMessages = {}
         const promises = filteredUsers.map(async (user)=>{
            const messages = await Message.find({senderId:user._id,receiverId:userId,seen:false})
            if(messages.length > 0){
                unseenMessages[user._id] = messages.length
            }
         })
         await Promise.all(promises);
         res.json({success:true,users:filteredUsers,unseenMessages})
    } catch (error) {
        console.log(error.message);
        res.json({
            success:false,
            message:error.messages
        })
        
        
    }
}

export const getMessages = async(req,res)=>{
    try {
        const {id:selectedUserId} = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or:[
                {senderId:myId,receiverId:selectedUserId},
                {senderId:selectedUserId,receiverId:myId},
            ]
        })
        await Message.updateMany({senderId:selectedUserId,receiverId:myId},{seen:true});
        res.json({success:true,messages})
    } catch (error) {
        console.log(error.message);
        res.json({
            success:false,
            message:error.messages
        })
    }
}
//seen using  message id

export const markMessageAsSeen = async(req,res)=>{
    try {
        const {id} = req.params;
        await Message.findByIdAndUpdate(id,{seen:true});
        res.json({success:true})
    } catch (error) {
        console.log(error.message);
        res.json({
            success:false,
            message:error.messages
        })
    }
}

export const sendMessage = async(req,res)=>{
try {
    

    const  {text,image} = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;
    let imageUrl;
    if(image){
        const uploadResponse = await cloudinary.uploader.upload(image)
        imageUrl = uploadResponse.secure.url;

    }

    const newMessage = await Message.create({
        senderId,
        receiverId,text,image:imageUrl,
    })

    // emit new messages to reciever
    const recieverSocketId = userSocketMap[receiverId];
    if(recieverSocketId){
        io.to(recieverSocketId).emit("newMessages",newMessage)
    }

    res.json({
        success:true,
        newMessage
    })
} catch (error) {
    console.log(error.message);
    res.json({
        success:false,
        message:error.messages
    })
}
}