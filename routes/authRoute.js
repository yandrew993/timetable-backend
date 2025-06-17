import express from 'express';
const router = express.Router();
import {
  registerUser,
  loginUser
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/verifyToken.js';



// Auth routes
router.post('/register', registerUser);
router.post('/login',verifyToken, loginUser);

export default router;