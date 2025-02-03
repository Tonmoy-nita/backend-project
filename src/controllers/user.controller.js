import {asyncHandler} from "../utils/asyncHandler.js";
import  {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponce} from "../utils/ApiResponce.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken =async(userId) =>{
    try {
        const user = await User.findById(userId);
        const accessToken =user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong");
    }
}


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


const loginUser = asyncHandler(async(req,res)=>{

    //TODOS :

    //reqbody theke data niye aso

    const {email, username, password} = req.body

    //username or email deoa hoye6e kina? 

    if(!username && !email){
        throw new ApiError(400,"username or email is required.")
    }
    
    //find the user-user a6he ki na database e check koro

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    //password check korte hobe
    
    const isPasswordValid= await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid Password")
    }

    //password jodi match hoi to access and refresh token generate korte hobe

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    //cookies r modhye diye ei token ke pathate hobe

    const loggedInUser =await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly: true,
        secure : true
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponce(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )

})


const logoutUser=asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken: undefined
        }
    },
    {
        new : true
    }
)

    const options={
        httpOnly: true,
        secure : true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponce(200,{},"User logged out"))
})


const refreshAccessToken = asyncHandler( async (req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken=jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user=User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options= {
            httpOnly : true,
            secure : true,
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user.id)
    
        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponce(200,
            {accessToken, refreshToken : newRefreshToken},
            "Access token refreshed"))

        } 
    catch (error) {
            throw new ApiError(401,error?.message  || "Invalid refresh token")
        }
    
    })
    

const changeCurrentPassword = asyncHandler( async (req,res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res.status(200)
    .json(new ApiResponce(200, {}, "Password changed successfully"))
})


const getCurrentUser =asyncHandler(async (req,res)=>{
    return res.status(200)
    .json(200,req.user,"current user fetch successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "Please provide all fields")
    }

    const user= await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                fullName,
                email : email
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponce(200, user, "Account details updated successfully"))
})


const updateUserAvatar = asyncHandler(async (req,res)=>{

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponce(200,user,"Avatar updated succesfully"))
})


const updateUserCoverImage = asyncHandler(async (req,res)=>{

    const coverLocalPath = req.file?.path

    if(!coverLocalPath){
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading cover image")
    }

    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponce(200,user,"Cover image updated succesfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}
