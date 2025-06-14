import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({ include: { teachers: true } });
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

export const getTotalSubjectsCount = async (req, res) => {
  try {
    const count = await prisma.subject.count();
    res.status(200).json({ totalSubjects: count });
  } catch (error) {
    console.error("Error counting teachers:", error);
    res.status(500).json({ error: "Failed to count teachers" });
  }
};

export const createSubject = async (req, res) => {
  const { subjectName, code } = req.body;
  try {
    const newSubject = await prisma.subject.create({
      data: { subjectName, code },
    });
    res.status(201).json(newSubject);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
};

// Get all subjects and their teachers
export const getSubjectsWithTeachers = async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        teachers: {
          include: {
            teacher: true, // Include teacher details
          },
        },
      },
    });
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects with teachers:', error);
    res.status(500).json({ error: 'Failed to fetch subjects with teachers' });
  }
}

// Subjects and classes assigned to a teacher
export const getSubjectsAssignedToTeacher = async (req, res) => {
  const { teacherName } = req.params;

  try {
    // Fetch assignments for the specific teacher
    const assignments = await prisma.subjectTeacher.findMany({
      where: {
        teacherName: teacherName, // Match the teacherName directly
      },
      include: {
        subject: {
          select: {
            subjectName: true, // Include only the subject name
          },
        },
        class: {
          select: {
            ClassName: true, // Include only the class name
          },
        },
      },
    });

    // Check if no assignments are found
    if (assignments.length === 0) {
      return res.status(404).json({
        error: `No subjects or classes assigned to teacher '${teacherName}'`,
      });
    }

    // Format the response to include only subject and class details
    const formattedAssignments = assignments.map((assignment) => ({
      subjectName: assignment.subject.subjectName,
      className: assignment.class.ClassName,
    }));

    res.status(200).json(formattedAssignments);
  } catch (error) {
    console.error(
      "Error fetching subjects and classes assigned to teacher:",
      error
    );
    res.status(500).json({ error: "Failed to fetch subjects and classes" });
  }
};



export default {
  getAllSubjects,
  createSubject,
  getTotalSubjectsCount,
  getSubjectsWithTeachers,
  getSubjectsAssignedToTeacher
};