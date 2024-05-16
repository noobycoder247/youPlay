import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

//cors
app.use(cors({
    origin: process.env.CORS_ORIGIN
}))

//express settings
app.use(express.json({
    limit: "16kb",
}));
app.use(express.urlencoded({
    limit: "16kb",
    extended: true
}));
app.use(express.static("public")); // If some images or some static file come and i want to store it in my server
app.use(cookieParser()); //To perform CRUD operation on Client browser

export default app