import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
//named import
// import { pool } from "./db.js";
// default import
import pool from "./db.js";

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
      "https://thia-e-comerce.vercel.app",
      "http://localhost:5173", // local dev, optional
    ],
    methods: ["GET", "POST", "DELETE", "PUT"], // Allow specific HTTP methods
    credentials: true, // Allow cookies and other credentials
  })
);



app.listen(() => {
  console.log(`Listening at port ${port}`);
});
