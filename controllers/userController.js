import bcrypt from "bcrypt";
import dotenv from "dotenv";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import { cloudinary } from "../config/cloudinary.js";

export const RegisterUser = async (req, res) => {
  const { firstname, lastname, email, password, confimpassword, adress } =
    req.body;
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format!",
      });
    }

    if (confimpassword !== password) {
      return res
        .status(400)
        .json({ success: false, message: "Password doe not match!" });
    }
    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    let imageUrl;
    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file.buffer);
    }
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rowCount < 1) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist in database!" });
    }

    const newUser = await pool.query(
      "INSERT INTO TABLE user ( firstname, lastname, email, password, adress) VALUES(1$, $2, $3, $4, $5)  RETURNING *",
      [firstname, lastname, email, hashedPassword, adress]
    );

    const verificationLink = `http://localhost:5173/verifyEmail?token=${verifyEmailToken}`;
    const message = "Click the link below to verify your account";
    await sendVerificationEmail(email, verificationLink, message);

    const userData = newUser.rows[0];
    delete userData.password; // Remove the password from the response
    return res.status(201).json({
      success: true,
      message:
        "Registered successfully. Please check your email for verification..",
      user: userData,
    });
  } catch (error) {
    console.log(error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to register user!",
    });
  }
};

const uploadImageToCloudinary = async (fileBuffer) => {
  try {
    const uploadPromise = new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "mealpot_user" },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          }
        )
        .end(fileBuffer);
    });

    const result = await uploadPromise;
    console.log("Upload successful:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("Image upload failed");
  }
};

const sendVerificationEmail = async (email, verificationLink, message) => {
  const mailOptions = {
    from: {
      name: "Meal Pot",
      address: process.env.EMAIL_HOST_USER,
    },
    to: email,
    subject: "Email Verification",
    html: `
  <div style="width: 100%; padding:10px 0; max-width: 600px; margin: auto; text-align: center;
  font-family: Arial, sans-serif; border-radius: 10px; overflow: hidden;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="height: 300px;">
      <tr>
      <td style="text-align: center; padding: 20px;">
          <img src="https://res.cloudinary.com/dtjgj2odu/image/upload/v1734469383/ThiaLogo_nop3yd.png" 
          alt="Thia's Apparel Logo" width="120" height="120" 
          style="max-width: 100%; display: block; margin: auto; border-radius: 50%;">
        </td>
      </tr>
    </table>
    

 <div style="padding: 10px; color:  #0B0F29;">
     
      <p  style="display: inline-block; padding: 12px 24px; background: #F1ECEC; 
      border: 5px solid #0B0F29; color: #656363; text-decoration: none; font-weight: bold; border-radius: 5px;">
      ${message}</p>

      <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background: #0B0F29; 
      border: 5px solid #0B0F29; color: #F20000; text-decoration: none; font-weight: bold; border-radius: 5px;"
      onmouseover="this.style.background='#FFF'; this.style.color='#0B0F29';"
      onmouseout="this.style.background='#0B0F29'; this.style.color='#F20000';">Verify Account</a>
      
      <p style="font-size: 16px;">If you did not request this, please ignore this email.</p>
    </div>






  </div>
`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
  }
};
