import express from 'express';
import {
    createTeacher,
    getAllTeachers,
    assignTeacherToSubject
} from '../controllers/teacherController.js';

const router = express.Router();

// Create a new teacher
router.post('/addteacher', createTeacher);
// Get all teachers
router.get('/teachers', getAllTeachers);
// Assign a teacher to a subject
router.post('/assignteacher', assignTeacherToSubject);


export default router;