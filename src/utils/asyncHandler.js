// const asyncHandler=()=>{}

// const asyncHandler=(fn)=>{()=>{}}
//we can write the above as below --->

// const asyncHandler=(fn)=>()=>{};



//async handler with try and catch method


// const asyncHandler =(fn) =>async(req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success : true,
//             message : error.message
//         })
//     }
// }



//async handler with promise method

const asyncHandler =(requestHandler)=>{
    return (rew,res,next)=>{
        Promise.resolve(requestHandler(requestHandler,res,next))
        .catch((err)=> {next(err)})
    }
} 

export {asyncHandler}