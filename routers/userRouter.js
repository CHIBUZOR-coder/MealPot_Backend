import express from "express";
import { RegisterUser, verifyEmail, LoginUser } from "../controllers/userController.js";
import uploads from "../middleware/uploads.js";
const userRouter = express.Router();

userRouter.post("/registerUser", uploads.single("image"), RegisterUser);
userRouter.post("/verifyEmail", verifyEmail);
userRouter.post("/loginUser", LoginUser);

export default userRouter;
