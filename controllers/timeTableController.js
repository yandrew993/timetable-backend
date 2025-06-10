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


export default {
  generateTimetableForAllClassesController,
  getTeacherLessonCount
};