import express from "express";
import { createClass, getAllClasses,getTotalTeachersCount } from "../controllers/classController.js";

const router = express.Router();
// Create a new class
router.post("/addclass", createClass);
// Get all classes
router.get("/classes", getAllClasses);
router.get("/classescount", getTotalTeachersCount);
// Export the router
export default router;
