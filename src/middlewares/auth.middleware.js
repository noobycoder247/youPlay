import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "") ||
      "";
    if (!token) {
      throw new ApiError(401, "UnAuthorized Access");
    }
    const decodedInfo = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );
    const user = await User.findById(decodedInfo?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid Access Token!");
    }
    // ***IMP***
    // Here we are setting user object to req obj so now we can access user from "req" on those routes where we insert this middleware
    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    throw new ApiError(500, err?.message || "Error in verifyJWT middleware");
  }
});
