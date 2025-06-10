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

export default {
  getAllSubjects,
  createSubject,
  getSubjectsWithTeachers
};