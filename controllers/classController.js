import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAllClasses = async (req, res) => {
  try {
    const classes = await prisma.class.findMany();
    res.status(200).json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
};

export const getTotalTeachersCount = async (req, res) => {
  try {
    const count = await prisma.class.count();
    res.status(200).json({ totalClasses: count });
  } catch (error) {
    console.error("Error counting teachers:", error);
    res.status(500).json({ error: "Failed to count teachers" });
  }
};

export const createClass = async (req, res) => {
  const {ClassName, formLevel, stream } = req.body;
  try {
    const newClass = await prisma.class.create({
      data: {ClassName, formLevel, stream },
    });
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
};

//Export all functions for use 
export default {
  getAllClasses,
  getTotalTeachersCount,
  createClass
};