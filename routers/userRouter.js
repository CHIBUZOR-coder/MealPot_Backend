import express from "express";
import { RegisterUser, verifyEmail } from "../controllers/userController.js";
import uploads from "../middleware/uploads.js";
const userRouter = express.Router();

userRouter.post("/registerUser", uploads.single("image"), RegisterUser);
userRouter.post("/verifyEmail", verifyEmail);

export default userRouter;
