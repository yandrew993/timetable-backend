import express from 'express';
import {  
    createSubject, 
    getAllSubjects, 
    getSubjectsWithTeachers
 } from '../controllers/subjectController.js';


const router = express.Router();
// Create a new subject
router.post('/addsubject', createSubject);
// Get all subjects
router.get('/subjects', getAllSubjects);
// Get all subjects with their teachers
router.get('/getsubjectsteachers', getSubjectsWithTeachers);

// Export the router
export default router;
