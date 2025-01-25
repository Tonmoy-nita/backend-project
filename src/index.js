// require('dotenv').config({path : './env'})



import mongoose from "mongoose";
import {DB_NAME} from './constants.js';
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({path : './env'});

// import app from " ./app.js"

connectDB()
.then(()=>{
    app.on("error",(error)=>{//eta ke use korar karon ho66e onek somoi database to connect hoye jai but amra setar sathe communicate korte pari na 
        console.log(" Err : ",error)
        throw error
    })
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{console.log("MongoDB connection Failed",err)})













//this is one approch for connecting to the database to store all the connection details in index.js file
/*import mongoose from "mongoose";
import {DB_NAME} from "./constants.js";


import express from "express";
const app =express()

;(async ()=>{//semicolon is for cleaning purpose eta ke use korar udeshho aktai j jodi ager line r end e semicolon use na kora thake then kono problem occur jate na hoi
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 
        app.on("error",(error)=>{//eta ke use korar karon ho66e onek somoi database to connect hoye jai but amra setar sathe communicate korte pari na 
            console.log(" Err : ",error)
            throw error
        })
        
        app.listen(process.env.PORT, ()=>{
            console.log(`Server is running on port : ${process.env.PORT}`)
        })
    } catch (error) {
        console.log("Error : ",error)
        throw error
    }
})();*/