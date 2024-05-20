import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { response } from "express";
import cookieParser from "cookie-parser";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if(!user) {
            throw new ApiError(500, "Unable to find user by ID during token creation")
        }
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }) // Because here i only want to update one field otherwise he will give erros like you didn't pass email, password etc
        return {accessToken, refreshToken};
    }
    catch(err) {
        throw new ApiError(500, "Error While creating Access and Refresh Token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from front-end
    // console.log("----", req.body);
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
    // console.log(">>>existing user", existingUser);
    if(existingUser) {
        throw new ApiError(409, "Username or Email already exist");
    }

    //Handling Files
    // console.log(req.files);
    const avatarLocalPath = req.files?.avatar ? req.files.avatar[0]?.path || "" : ""; // in request object multer added "files" that why we can access "files" here
    const coverImageLocalPath = req.files?.coverImage ? req.files.coverImage[0]?.path || "" : ""

    // console.log(">>> Loacl Path", avatarLocalPath);
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

const loginUser = asyncHandler(async (req, res) => {
    const {usernameOrEmail, password} = req.body
    if(!usernameOrEmail || !password) {
        throw new ApiError(401, "username/email and password is required");
    }
    const user = await User.findOne({
        $or: [{username: usernameOrEmail}, {email: usernameOrEmail}]
    });

    if(!user) {
        throw new ApiError(401, "User Not Found");
    }
    if(!await user.isPasswordCorrect(password)) {
        throw new ApiError(401, "Password didn't match");
    }
    
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id) // it might take time
    // console.log(accessToken, refreshToken);
    // Taking updated user from db
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    const cookieOptions = { // now the cookie is only modified by server not fron fronend
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(200, {
            user: loggedInUser,
            accessToken: accessToken, // ***IMP*** Why we are sending these tokens here we already set these in the cookies? 
            refreshToken: refreshToken // Because Suppose your Api use in mobile app so there they don't have cookie in mobile app so they can use these to store into mobile "LocalStroage"
        }, "User LoggedIn Successfully!")
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    console.log(req.user);
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: ""
            }
        },
        {
            new: true // returns new updated user object
        }
    )
    const cookieOptions = { // now the cookie is only modified by server not fron fronend
        httpOnly: true,
        secure: true
    }
    res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
        new ApiResponse(200, {}, "user logout successfully!!")
    )
})

export {registerUser, loginUser, logoutUser}