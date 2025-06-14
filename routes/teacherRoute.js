import express from 'express';
import {
    createTeacher,
    getAllTeachers,
    getTotalTeachersCount,
    assignTeacherToSubject,
    unassignTeacherFromSubject
} from '../controllers/teacherController.js';

const router = express.Router();

// Create a new teacher
router.post('/addteacher', createTeacher);
// Get all teachers
router.get('/teachers', getAllTeachers);
router.get('/teacherscount', getTotalTeachersCount);
// Assign a teacher to a subject
router.post('/assignteacher', assignTeacherToSubject);
// Unassign a teacher from a subject
router.post('/unassignteacher', unassignTeacherFromSubject);


export default router;