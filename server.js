import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routers/userRouter.js";
//named import
// import { pool } from "./db.js";
// default import



const app = express();
dotenv.config();
const port = process.env.PORT;

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Use cookie-parser middleware
app.use(cookieParser());

app.use(
  cors({
    // origin: "https://thia-e-comerce.vercel.app", // Ensure your frontend URL is allowed
    origin: [
      "http://localhost:8081",
      "http://localhost:5173", // local dev, optional
    ],
    methods: ["GET", "POST", "DELETE", "PUT"], // Allow specific HTTP methods
    credentials: true, // Allow cookies and other credentials
  })
);

app.use("/", userRouter);


app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});
