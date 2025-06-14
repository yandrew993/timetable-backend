import express from 'express';
import {  
    createSubject, 
    getAllSubjects,
    getTotalSubjectsCount, 
    getSubjectsWithTeachers,
    getSubjectsAssignedToTeacher
 } from '../controllers/subjectController.js';


const router = express.Router();
// Create a new subject
router.post('/addsubject', createSubject);
// Get all subjects
router.get('/subjects', getAllSubjects);
router.get('/subjectscount', getTotalSubjectsCount);
// Get all subjects with their teachers
router.get('/getsubjectsteachers', getSubjectsWithTeachers);
// Get subjects assigned to a specific teacher
// Get subjects assigned to a specific teacher
router.get('/teachers/:teacherName/subjects', getSubjectsAssignedToTeacher);

// Export the router
export default router;
