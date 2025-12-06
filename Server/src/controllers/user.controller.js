import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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


        const {fullName, channelName, email, username, password} =req.body
        // console.log("email :",email)
        // console.log("password :",password)
    
    //validation-not empty


        if([fullName, channelName, email, username, password].some((field)=>{
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
        channelName,
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
            new ApiResponse(200,createdUser,"User Registered Successfully")
        )

})


const loginUser = asyncHandler(async(req,res)=>{

    //TODOS :

    //reqbody theke data niye aso

    const {email, username, password} = req.body

    // basic validation and normalization
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedUsername = username?.trim().toLowerCase();
    const sanitizedPassword = (password ?? "").trim();

    if(!normalizedUsername && !normalizedEmail){
        throw new ApiError(400,"username or email is required.")
    }

    if(!sanitizedPassword){
        throw new ApiError(400,"password is required")
    }
    
    //find the user-user a6he ki na database e check koro

    const user = await User.findOne({
        $or: [{username: normalizedUsername},{email: normalizedEmail}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    //password check korte hobe
    
    const isPasswordValid= await user.isPasswordCorrect(sanitizedPassword)

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
        new ApiResponse(
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
    .json(new ApiResponse(200,{},"User logged out"))
})


const refreshAccessToken = asyncHandler( async (req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken=jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user=await User.findById(decodedToken?._id)
    
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
        .json(new ApiResponse(200,
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
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser =asyncHandler(async (req,res)=>{
    return res.status(200)
    .json(
        new ApiResponse(200,req.user,"current user fetch successfully")
    )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, channelName, username, removeCover } = req.body;
    const user = await User.findById(req.user?._id);

    if (fullName) {
        user.fullName = fullName;
    }

    if (channelName) {
        if (!channelName.trim()) {
            throw new ApiError(400, "Channel name cannot be empty");
        }
        user.channelName = channelName;
    }

    if (username && username.trim()) {
        const normalizedUsername = username.trim().toLowerCase();
        if (normalizedUsername !== user.username) {
            const exists = await User.findOne({ username: normalizedUsername });
            if (exists) {
                throw new ApiError(409, "Username already taken");
            }
            user.username = normalizedUsername;
        }
    }

    if (req.files?.avatar) {
        const avatarLocalPath = req.files.avatar[0].path;
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (avatar.url) {
            user.avatar = avatar.url;
        } else {
            throw new ApiError(400, "Error while uploading avatar");
        }
    }

    if (req.files?.coverImage) {
        const coverImageLocalPath = req.files.coverImage[0].path;
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (coverImage.url) {
            user.coverImage = coverImage.url;
        } else {
            throw new ApiError(400, "Error while uploading cover image");
        }
    } else if (removeCover === "true") {
        user.coverImage = "";
    }

    await user.save({ validateBeforeSave: false });

    const updatedUser = await User.findById(user._id).select("-password");

    return res.status(200)
        .json(new ApiResponse(200, updatedUser, "Account details updated successfully"));
});


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
    .json(new ApiResponse(200,user,"Avatar updated succesfully"))
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
    .json(new ApiResponse(200,user,"Cover image updated succesfully"))
})


const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    }

    const channel = await User.findOne({ username: username.toLowerCase() }).select("-password -refreshToken");

    if (!channel) {
        throw new ApiError(404, "Channel does not exist");
    }

    return res.status(200).json(new ApiResponse(200, channel, "User channel fetched successfully"));
});

const getUserProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(new ApiResponse(200, user, "User profile fetched successfully"));
});


const getWatchingHistory=asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{_id : new mongoose.Types.ObjectId(req.user._id)}
        },
        {
            $lookup:{
                from: "videos",
                localField : "watchingHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup :{
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline :[
                                {
                                    $project:{
                                        fullName : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields :{
                             owner :{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"Watch history fetched succesfully")
    )
})

export {
    changeCurrentPassword,
    getCurrentUser, getUserChannelProfile, getUserProfile,
    getWatchingHistory, loginUser,
    logoutUser,
    refreshAccessToken, registerUser, updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};

