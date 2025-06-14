import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { generateTimetableForAllClasses } from '../utils/scheduler.js';

export const generateTimetableForAllClassesController = async (req, res) => {
  try {
    // Call the function to generate timetables
    const timetables = await generateTimetableForAllClasses();

    // Respond with the generated timetables
    res.status(200).json({
      success: true,
      data: timetables,
    });
  } catch (error) {
    console.error('Error generating timetables:', error);

    // Respond with an error message
    res.status(500).json({
      success: false,
      message: 'Failed to generate timetables',
      error: error.message,
    });
  }
};

export const getAllTableEntries = async (req, res) => {
  try {
    const classes = await prisma.timetableEntry.findMany();
    res.status(200).json(classes);
  } catch (error) {
    console.error('Error fetching timetable entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
};

export const getTotalLessonsCount = async (req, res) => {
  try {
    const count = await prisma.timetableEntry.count();
    res.status(200).json({ totalLessons: count });
  } catch (error) {
    console.error("Error counting teachers:", error);
    res.status(500).json({ error: "Failed to count teachers" });
  }
};

// Total number of lessons assigned to each teacher from timetable entries
export const getTeacherLessonCount = async (req, res) => {
  try {
    const teacherCounts = await prisma.timetableEntry.groupBy({
      by: ['teacherName'],
      _count: {
        id: true,
      },
    });

    // Directly use the results from groupBy since we already have teacher names
    const result = teacherCounts.map(entry => ({
      teacherName: entry.teacherName,
      lessonCount: entry._count.id,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching teacher lesson counts:', error);
    res.status(500).json({ error: 'Failed to fetch teacher lesson counts' });
  }
};



export const deleteAllTimetableEntries = async (req, res) => {
  try {
    await prisma.timetableEntry.deleteMany({});
    res.status(200).json({ message: 'All timetable entries deleted successfully' });
  } catch (error) {
    console.error('Error deleting timetable entries:', error);
    res.status(500).json({ error: 'Failed to delete timetable entries' });
  }
};



export default {
  generateTimetableForAllClassesController,
  getTeacherLessonCount,
  getTotalLessonsCount,
  getAllTableEntries,
  deleteAllTimetableEntries
};