import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: { subjects: true },
    });
    res.status(200).json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
};

export const createTeacher = async (req, res) => {
  const { teacherId, teacherName } = req.body;
  try {
    const newTeacher = await prisma.teacher.create({
      data: { teacherId, teacherName },
    });
    res.status(201).json(newTeacher);
  } catch (error) {
    console.error("Error creating teacher:", error);
    res.status(500).json({ error: "Failed to create teacher" });
  }
};

export const assignTeacherToSubject = async (req, res) => {
  const { code, teacherName, ClassName } = req.body;

  // Validate input
  if (!code || !teacherName || !ClassName) {
    return res
      .status(400)
      .json({
        error: "Subject code, teacher name, and class name are required",
      });
  }

  try {
    // Find the subject by code
    const subject = await prisma.subject.findFirst({
      where: { code },
    });

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // Find the teacher by name
    const teacher = await prisma.teacher.findFirst({
      where: { teacherName },
      include: { subjects: true }, // Include subjects to check if the teacher is already assigned
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Find the class by name
    const classObj = await prisma.class.findFirst({
      where: { ClassName },
      include: { subjectTeachers: true }, // Include subjectTeachers to check if the teacher is already assigned to this class
    });

    if (!classObj) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Check if the subject is already assigned to a teacher for this class
    const existingAssignment = await prisma.subjectTeacher.findFirst({
      where: {
        subject: { code: subject.code },
        class: { ClassName: classObj.ClassName },
      },
    });

    if (existingAssignment) {
      return res.status(400).json({
        error: `'${subject.subjectName}' is already assigned to a teacher for class '${classObj.ClassName}'`,
      });
    }

    // Create the SubjectTeacher record
    const subjectTeacher = await prisma.subjectTeacher.create({
      data: {
        subject: { connect: { code: subject.code } },
        teacher: { connect: { teacherName: teacher.teacherName } },
        class: { connect: { ClassName: classObj.ClassName } },
      },
      include: {
        teacher: true,
        subject: true,
        class: true,
      },
    });

    return res.status(201).json(subjectTeacher);
  } catch (error) {
    console.error("Error assigning teacher to subject:", error);
    return res
      .status(500)
      .json({ error: "Failed to assign teacher to subject" });
  }
};
export default {
  getAllTeachers,
  createTeacher,
  assignTeacherToSubject,
};
