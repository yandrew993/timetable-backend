import express from 'express';
import { generateTimetableForAllClassesController, 
    getTeacherLessonCount
} from '../controllers/timeTableController.js';

const router = express.Router();

router.post('/generate', generateTimetableForAllClassesController);
router.get('/teachercount', getTeacherLessonCount);

export default router;