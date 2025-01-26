import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";


const userSchema = new Schema({
    username : {
        type :String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index :true
    },
    email : {
        type :String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true
    },
    fullName : {
        type :String,
        required : true,
        trim : true,
        index : true
    },
    avatar :{
        type :String,//here we use cloudnary url we upload image on cloudnary and then we get url of that image and use that here
        required : true
    },
    coverImage : {
        type : String,
    },
    watchHistory:[
        {
            type : Schema.Types.ObjectId,
            ref : "Video"
        }
    ],
    password : {
        type :  String,
        required : [true , 'password is required']
    },
    refreshToken :{
        type : String
    }
},{timestamps : true})


userSchema.pre("save", async function(next){
    if(! this.isModified("password")) //ekhaen eta ho66e j jodi password modify na kora hoi tahole next middleware e chole jao
    return next()

    //eta else part
    this.password = bcrypt.hash(this.password,10)//else jodi password change or modify kora hoi then sei tike encrypt koro abong tarpor next middleware e jao 
    next()
})
//ei method ti use hoi actual password abong je password enter kora hoye6e setar modhye compare kore check korar jonno
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

//access token genreate korar jonno

userSchema.methods.generateAccessToken = function()
{
    return jwt.sign({
        _id : this.id,
        email : this.email,
        username : this.username,
        fullName : this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,{
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken =function() {
    return jwt.sign({
        _id : this.id,
        email : this.email,
        username : this.username,
        fullName : this.fullName
    },
    process.env.REFRESH_TOKEN_SECRET,{
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    }
)
}


export const User = mongoose.model("User",userSchema)