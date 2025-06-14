import express from "express";
import {
  generateTimetableForAllClassesController,
  getTeacherLessonCount,
  getTotalLessonsCount,
  getAllTableEntries,
  deleteAllTimetableEntries,
} from "../controllers/timeTableController.js";

const router = express.Router();

router.post("/generate", generateTimetableForAllClassesController);
router.get("/teachercount", getTeacherLessonCount);
router.get("/lessoncount", getTotalLessonsCount);
router.get("/getentries", getAllTableEntries);
router.delete("/deleteall", deleteAllTimetableEntries);

export default router;
