import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Register a new user (Student or Teacher)
export const registerUser = async (req, res) => {
  const { name, userId, password, role } = req.body;

  if (!name || !userId || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (role !== "student" && role !== "teacher" && role !== "librarian") {
    return res.status(400).json({ error: "Invalid role. Must be 'student', 'teacher', or 'librarian'" });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { userId } });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await prisma.user.create({
      data: { name, userId, password: hashedPassword, role },
    });

    res.status(201).json({ message: `${role} registered successfully` });
  } catch (error) {
    res.status(500).json({ error: "Failed to register user" });
    console.error(error);
  }
};

// Login for both Students and Teachers
export const loginUser = async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: "UserId and password are required" });
  }

  try {
    // Find user in the User table
    const user = await prisma.user.findUnique({ where: { userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Define token expiration age (7 days)
    const age = 1000 * 60 * 60 * 24 * 7;

    // Generate a new JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    // Exclude password from user data
    const { password: userPassword, ...userInfo } = user;

    // Set token as an HTTP-only cookie and send user data
    res
      .cookie("token", token, {
        httpOnly: true,
        // secure: true, // Uncomment this in production for HTTPS
        maxAge: age,
      })
      .status(200)
      .json({
        message: "Login successful",
        user: userInfo,
      });
  } catch (error) {
    res.status(500).json({ error: "Failed to login" });
    console.error(error);
  }
};

export default {
  registerUser,
  loginUser,
};
