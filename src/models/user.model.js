import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowecase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  // Dont use Arrow function here because Arrow Function don't have "this" keyword access or curremt context access
  // If Password is modified then only decrypt the password
  if (!this.isModified("password")) {
    return next();
  }
  this.password = bcrypt.hash(this.password, 10);
  next();
});

// It's like we are creating method inside model in DJANGO
userSchema.method.isPasswordCorrect = async function(password) { // using async because it's taking computational power so it can take time like api call 
    return await bcrypt.compare(password, this.password);
}

userSchema.method.generateAccessToken = function() {
    jwt.sign({
        _id: this._id,
        email: this.email,
        fullName: this.fullName
    }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: process.env.ACCESS_TOKEN_EXPIRY});
};
userSchema.method.generateRefreshToken = function() {
    jwt.sign({
        _id: this._id
    }, process.env.REFRESH_TOKEN_SECRET, {expiresIn: process.env.REFRESH_TOKEN_EXPIRY});
};

export const User = mongoose.model("User", userSchema);
