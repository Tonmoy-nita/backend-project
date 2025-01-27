import {asyncHandler} from "../utils/asyncHandler.js"


const registerUser = asyncHandler( async(req,res)=>{
    return res.status(404).json({
        message : "Tonmoy Bhowmick"
    })
})


export {registerUser}