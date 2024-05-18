import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
    // get user details from front-end
    console.log("----", req.body);
    const {username, email, fullName, password} = req.body
    if([username, email, fullName, password].some((field)=>field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }
    // Check user email or username already exist
    // "findOne" is like User.object.get(username=usernmae) it's return one record if exist
    
    // User.findOne({username}) // fetch one user of this username. 
    // What if i want to check either username or email exist or "OR" condition
    const existingUser = await User.findOne({
        $or: [{username}, {email}] // check either username or email exist
    })
    console.log(">>>existing user", existingUser);
    if(existingUser) {
        throw new ApiError(409, "Username or Email already exist");
    }

    //Handling Files
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar ? req.files.avatar[0]?.path || "" : ""; // in request object multer added "files" that why we can access "files" here
    const coverImageLocalPath = req.files?.coverImage ? req.files.coverImage[0]?.path || "" : ""

    console.log(">>> Loacl Path", avatarLocalPath);
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar File is required");
    }

    let avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar) {
        throw new ApiError(400, "Unable to upload on cloudinary");
    }

    let coverImage = "";
    if(coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    const user = await User.create({
        fullName,
        username,
        avatar: avatar.url, // we are getting cloudinary response and we are fetching url
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    // preparing response and removing passowrd and refreshToken field
    const createdUser = await User.findById(user?._id || -1).select("-password -refreshToken");
    if(!createdUser) {
        throw new ApiError(500, "Unable to create user while registration");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered Successfully") 
    )
})

export {registerUser}