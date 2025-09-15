import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
import dotenv from 'dotenv'
import stream from 'stream'

dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (file) => {
    try {
        console.log("Cloudinary config:", {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        
        if (!file) return null;

        let response;
        
        // Check if the input is a Buffer (from memory storage)
        if (Buffer.isBuffer(file)) {
            console.log("Uploading from buffer to Cloudinary...");
            
            // Create a readable stream from the buffer
            const bufferStream = new stream.PassThrough();
            bufferStream.end(file);

            // Use the stream to upload the file to Cloudinary
            response = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({ resource_type: "auto" }, (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload failed from buffer:", error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
                bufferStream.pipe(uploadStream);
            });

        } else if (typeof file === 'string') { // Assume it's a local file path
            console.log("Uploading from local path to Cloudinary...");
            response = await cloudinary.uploader.upload(file, {
                resource_type: "auto"
            });
            // Delete the local file after successful upload
            fs.unlinkSync(file);
        } else {
            console.error("Invalid file input: must be a buffer or local file path.");
            return null;
        }

        console.log("File uploaded on Cloudinary, file URL:", response.url);
        return response;

    } catch (error) {
        console.error("Error on Cloudinary:", error);
        // Clean up the local file in case of an error if it exists
        if (typeof file === 'string' && fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
        return null;
    }
}

const deleteFromCloudinary = async  (publicId) =>{
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        console.log("Deleted from cloudinary. public ID", publicId)
    } catch (error) {
        console.log("Error deleting the file from cloudinary !", error)
        return null
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}