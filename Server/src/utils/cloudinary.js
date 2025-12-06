import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary =async(localFilePath)=>{
    try{
        if(!localFilePath) return null
        
        const responce =await cloudinary.uploader.upload(localFilePath, {
            
            resource_type : "auto",
            folder : "VideoTube"
    })
    // console.log("File is uploadede successfull",responce.url)
    fs.unlinkSync(localFilePath)
    return responce;
    
}catch(error){
    fs.unlinkSync(localFilePath)//remove the localily saved temporary file as the uploaded operation got failed
    return null;
}
}

const deleteOnCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) return null;

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        return result;
    } catch (error) {
        console.log("Error deleting from Cloudinary", error);
        return null;
    }
};

export { deleteOnCloudinary, uploadOnCloudinary };

