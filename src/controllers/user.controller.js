import {asyncHandler} from "../utils/asyncHandler.js";
import  {ApiError} from "../utils/ApiError.js";
import {User} from "../models/User.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponce} from "../utils/ApiResponce.js";

const registerUser = asyncHandler( async(req,res)=>{
    
    //get user details from frontend


        const {fullName, email, username, password} =req.body
        // console.log("email :",email)
        // console.log("password :",password)
    
    //validation-not empty


        if([fullName,email,username,password].some((field)=>{
            return field?.trim()===""}))
        {
            throw new ApiError(400,"All fields are required");    
        }
        if (!email.includes("@")) {
            throw new ApiError(400, "Email format is not correct.");
        }
    
    //check if user already exist : username,email


        const existedUser= await User.findOne({
            $or: [{email}, {username}],
        })
        if(existedUser){
            throw new ApiError(409,"Email or username already exist")
        }

    //check for images,check for avtar(follow user schema jekahne user r ki ki lagbe seta deoa a6he so amader ka6e registration e user segulo di66e kina seta check kora)
    
        console.log(req.files)
    
        const avatarLocalPath = req.files?.avatar[0]?.path;
        // const coverImageLocalPath = req.files?.coverImage[0]?.path;

        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
            coverImageLocalPath = req.files.coverImage[0].path
        }

        if(!avatarLocalPath){
            throw new ApiError(400, "Avatar is required");
        }

    //upload them to cloudnary,avatar sucessfully uplaod hoye6e kina check korte hobe
    
    
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)
        if(!avatar){
            throw new ApiError(400, "Avatar upload failed");
        }


    //create user object - create entry in db
    
    
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    
    //remove password and refresh token field from responce
    //check for user creation - succesfull or error check korte hobe
    //ei 2 to kaj ek sathe korbo amra


        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )

        if(!createdUser){
            throw new ApiError(500, "User creation failed while registering the user")
        }


    //return responce


        return res.status(201).json(
            new ApiResponce(200,createdUser,"User Registered Successfully")
        )

})

export {
    registerUser,
}