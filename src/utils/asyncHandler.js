//--------------------PROMISE--------------------------------
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) => {
      next(error);
    });
  };
};

export { asyncHandler };

// --------------------TRY CATCH-----------------------------
// const asyncHandler = (fn) => {() => {}};

// const asyncHandler = (fn) => async(req, res, next) => {
//     try {
//         await fn(req, res, next);
//     }
//     catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// };

// Here Nothing Happens we don't need to warp it with try catch everytime with wrapper we just pass the function to our wrapper function "asyncHandler" and it's done
// const getUser = async (req, res, next) => {
//     const user = await User.findById(req.params.id); // Assume User is a Mongoose model
//     if (!user) {
//         throw { code: 404, message: 'User not found' };
//     }
//     res.json(user);
// };

// // Use asyncHandler to wrap the async route handler
// app.get('/user/:id', asyncHandler(getUser));
