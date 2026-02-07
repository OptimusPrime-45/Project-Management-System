import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, folder = "uploads") => {
    try {
        if (!localFilePath) return null;
        
        // Uploads file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: folder,
        });
        
        // file uploaded successfully
        console.log("File is uploaded on cloudinary", response.secure_url);
        
        // remove the locally saved temporary file
        fs.unlinkSync(localFilePath);
        
        return response;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        // remove the locally saved temporary file as the upload operation failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) return null;
        
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        
        console.log("File deleted from cloudinary:", publicId);
        return response;
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
