import bcrypt from "bcrypt";
import dotenv from "dotenv";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import { cloudinary } from "../config/cloudinary.js";
import { transporter } from "../config/email.js";
import { generateToken } from "../middleware/generateToken.js";
export const RegisterUser = async (req, res) => {
  const {
    firstname,
    lastname,
    email,
    password,
    confirmpassword,
    adress,
    owner,
    phone,
  } = req.body;

  console.log("reqbody:", req.body);

  try {
    const client = await pool.connect();

    await client.query("BEGIN");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format!",
      });
    }

    if (confirmpassword !== password) {
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

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rowCount > 0) {
      return res
        .status(400)
        .json({ success: false, message: "User already exist in database!" });
    }else{
      console.log("somthig went wong");
      
    }

    let imageUrl;
    const { image } = req.body;
    if (image) {
      imageUrl = await uploadImageToCloudinary(image);
      console.log("Uploaded Image URL:", imageUrl);
    }

    const newUser = await pool.query(
      "INSERT INTO  users ( firstname, lastname, email, password, adress, phone, image, role) VALUES($1, $2, $3, $4, $5, $6, $7, $8)  RETURNING *",
      [
        firstname,
        lastname,
        email,
        hashedPassword,
        adress,
        phone,
        imageUrl,
        owner === "true" ? "owner" : "user",
      ]
    );

    try {
      if (!newUser.rows > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Unable to register user" });
      }
    } catch (error) {
      console.log("error", error);
    }
    // Generate email verification token
    const verifyEmailToken = jwt.sign({ email }, process.env.EMAIL_SECRET, {
      expiresIn: "1h",
    });

    const verificationLink = `http://localhost:8081/VerifyEmail?token=${verifyEmailToken}`;
    const message = "Click the link below to verify your account";

    try {
      await sendVerificationEmail(email, verificationLink, message);
    } catch (error) {
      console.log(error.message);
      await client.query("ROLLBACK");
      client.release();
      return res.status(400).json({
        success: false,
        message: error.message || "Unable to register user!",
      });
    }

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

export const verifyEmail = async (req, res) => {
  console.log("req.body:", req.body);
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Token and email are required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.EMAIL_SECRET); // Use your JWT secret key

    if (!decoded) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    // Extract email
    const { email } = decoded;

    // const user = await prisma.user.findUnique({

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (!user.rowCount === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Unable to find user" });
    }

    const update = await pool.query(
      "UPDATE users SET verified = TRUE WHERE email = $1",
      [email]
    );
    // If verification is successful, send a success response

    if (update.rowCount > 0) {
      return res.status(200).json({
        success: true,
        message: "Email verified successfully",
        data: decoded, // Optionally send decoded data
      });
    }
  } catch (error) {
    console.error("Email verification error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Email verification failed" });
  }
};

export const LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("reqbody:", req.body);

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    console.log("user query result:", user);

    if (user.rowCount === 0) {
      console.log("User not found");
      return res
        .status(400)
        .json({ success: false, message: "User does not exist!" });
    }

    const foundUser = user.rows[0];
    console.log("Found user:", foundUser);

    const VerifyToken = jwt.sign({ email }, process.env.EMAIL_SECRET, {
      expiresIn: "1h",
    });
    console.log("VerifyToken:", VerifyToken);

    const validatePassword = await bcrypt.compare(password, foundUser.password);
    console.log("Password valid:", validatePassword);

    if (!validatePassword) {
      console.log("Invalid password");
      return res
        .status(400)
        .json({ success: false, message: "Password is not correct" });
    }

    const verificationLink = `http://localhost:8081/VerifyEmail?token=${VerifyToken}`;
    const message = `A link has benn sent to ${email}`;

    if (foundUser.verified !== true) {
      console.log("User not verified, sending verification email");
      await sendVerificationEmail(email, verificationLink, message);
      return res.status(400).json({
        success: false,
        message: `You have not verified your account. A new verification link has been sent to ${email}.`,
      });
    }

    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });

    const token = generateToken({
      id: foundUser.id,
      role: foundUser.role,
      email: foundUser.email,
      firstname: foundUser.firstname,
      lastname: foundUser.lastname,
      address: foundUser.address || "No Address Provided",
      phone: foundUser.phone || "No Phone Provided",
      image: foundUser.image,
    });
    console.log("Generated token:", token);

    if (!token) {
      console.log("Token generation failed");
      return res.status(400).json({ success: false, message: "Invalid Token" });
    }

    // Don't use res.cookie() for React Native
    // res.cookie("auth_token", token, {...});

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token, // ⬅️ Send token in response
      user: {
        id: foundUser.id,
        email: foundUser.email,
        firstname: foundUser.firstname,
        lastname: foundUser.lastname,
      },
    });
  } catch (error) {
    console.error("LoginUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later!",
    });
  }
};

export const AccountRecovery = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (!user.rowCount > 1) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist in database" });
    }

    const recoveryToken = jwt.sign({ email }, process.env.EMAIL_SECRET, {
      expiresIn: "10m",
    });
    const recoveryLink = `http://localhost:8081/RecoveryPage?token=${recoveryToken}`;

    const message = `Clink on the link below to verify your account `;

    try {
      await sendVerificationEmail(email, recoveryLink, message);
    } catch (error) {
      console.log(error.message);
      await client.query("ROLLBACK");
      client.release();
      return res.status(400).json({
        success: false,
        message: error.message || "Unable to register user!",
      });
    }

    return res.status(200).json({
      success: true,
      message: `A verification link has been sent to ${email}`,
    });
  } catch (error) {
    console.log("error:", error.message);
    return res.status(400).json({
      success: false,
      message: "An error occured, please try agai later!",
    });
  }
};
