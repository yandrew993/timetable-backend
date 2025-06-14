import express from 'express';
import cors from 'cors'; // Import the CORS middleware
import timetableRoutes from './routes/timeTableRoute.js'; // Adjust the path as necessary
import teacherRoutes from './routes/teacherRoute.js';
import subjectRoutes from './routes/subjectRoute.js'; // Assuming you have a subject route
import classRoutes from './routes/classRoute.js'; // Assuming you have a class route

const app = express();

// Enable CORS
app.use(cors({
  origin: 'smart-timetable-five.vercel.app', // Allow requests from this origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
  credentials: true, // Allow cookies and credentials
}));

app.use(express.json());
app.use('/api', timetableRoutes);
app.use('/api', teacherRoutes);
app.use('/api', subjectRoutes); // Use the subject routes
app.use('/api', classRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));