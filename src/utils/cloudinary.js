import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  // Like here we are handling file and uploading stuff so both takes time that's why we are using async
  try {
    if (!filePath) return null;
    // Upload the file
    const uploadResult = await cloudinary.uploader
      .upload(filePath, {
        resource_type: "auto",
      })
      .catch((error) => {
        console.log(error);
      });
    // console.log("file upload successfully!", uploadResult);
    fs.unlinkSync(filePath); // remove the locally temporary saved file
    return uploadResult;
  } catch (err) {
    fs.unlinkSync(filePath); // remove the locally temporary saved file
    return null;
  }
};

export {uploadOnCloudinary};
