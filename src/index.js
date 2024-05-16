import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

const port = process.env.PORT || 8000;

connectDB()
.then(()=>{
    app.list(port, () => {
        app.on("error", (error)=>{
            console.log("ERR: ", error);
        })
        console.log(`Server Running on Port ${port}`);
    })
})
.catch((error)=>{
    console.log("Unable to Connect with Mongo Database!", error);
});