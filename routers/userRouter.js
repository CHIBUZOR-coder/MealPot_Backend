import express from "express";
import { RegisterUser } from "../controllers/userController";
const router = express.Router();

router.post("/registerUser", RegisterUser);
