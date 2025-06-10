import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SLOT_TIMES = [
  "08:00",
  "08:40",
  "09:20",
  "10:30",
  "11:10",
  "11:55",
  "12:35",
  "14:00",
  "14:40",
  "15:20",
];

const BREAK_SLOTS = [3, 5, 7, 9];

function getTimeRange(slotIndex) {
  const start = new Date(`2000-01-01T${SLOT_TIMES[slotIndex]}:00Z`);
  const end = new Date(start.getTime() + 40 * 60000);
  return { start, end };
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

export async function generateTimetableForAllClasses() {
  const classes = await prisma.class.findMany();
  const subjects = await prisma.subject.findMany({
    include: {
      teachers: {
        include: {
          teacher: true, // Include the Teacher model to fetch teacher details
        },
      },
    },
  });
  const teachers = await prisma.teacher.findMany({
    include: {
      subjects: {
        include: {
          subject: true, // Include the Subject model to fetch subject details
        },
      },
    },
  });

  const allTimetables = [];
  const teacherSchedule = {};

  // Initialize teacher schedules
  for (const day of DAYS) {
    teacherSchedule[day] = {};
    for (const teacher of teachers) {
      teacherSchedule[day][teacher.id] = [];
    }
  }

  for (const classObj of classes) {
    const classSchedule = {};
    const timetableEntries = [];

    // Initialize class schedule
    for (const day of DAYS) {
      classSchedule[day] = [];
    }

    const comboPairs = [
      ["AGRIC", "BST"],
      ["PHYSICS", "CRE"],
      ["GEOGRAPHY", "HISTORY"],
    ];

    const getSubjectByName = (subjectName) =>
      subjects.find(
        (s) => s.subjectName.toUpperCase() === subjectName.toUpperCase()
      );

    const isSlotFree = (schedule, day, slot, teacherId = null) => {
      // Ensure the day exists in the schedule
      if (!schedule[day]) {
        schedule[day] = teacherId ? {} : [];
      }

      // If checking for a specific teacher, ensure the teacher's schedule exists
      if (teacherId) {
        if (!schedule[day][teacherId]) {
          schedule[day][teacherId] = [];
        }
        return !schedule[day][teacherId].includes(slot);
      }

      // Check if the slot is free for the class schedule
      return !schedule[day].some((s) => s.slot === slot);
    };

    const assignLesson = (day, slot, subject, teacher, double = false) => {
      if (!teacher || !teacher.id || !teacher.teacherName) {
        console.warn(
          `Skipping lesson assignment for subject ${subject.subjectName} due to missing teacher.`
        );
        return;
      }

      const { start, end } = getTimeRange(slot);
      const entry = {
        weekday: day,
        subjectName: subject.subjectName, // Use subjectName for display and storage
        teacherId: teacher.id, // Keep teacherId for database storage
        teacherName: teacher.teacherName, // Include teacher name for display
        ClassName: classObj.ClassName, // Include class name for display
        startTime: start,
        endTime: end,
        isDouble: double,
      };
      classSchedule[day].push({ slot, subjectName: subject.subjectName });
      teacherSchedule[day][teacher.id].push(slot);
      timetableEntries.push(entry);
    };

    // 1. Assign combo subjects at the same time
    if (classObj.formLevel === 3 || classObj.formLevel === 4) {
      for (const [s1Name, s2Name] of comboPairs) {
        const s1 = getSubjectByName(s1Name);
        const s2 = getSubjectByName(s2Name);
        if (!s1 || !s2) continue;
        const t1 = s1.teachers[0],
          t2 = s2.teachers[0];
        if (!t1 || !t2) continue;

        outer: for (const day of DAYS) {
          for (let slot = 0; slot < 10; slot++) {
            if (
              isSlotFree(classSchedule, day, slot) &&
              isSlotFree(teacherSchedule, day, slot, t1.id) &&
              isSlotFree(teacherSchedule, day, slot, t2.id)
            ) {
              assignLesson(day, slot, s1, t1);
              assignLesson(day, slot, s2, t2);
              break outer;
            }
          }
        }
      }
    }

    // 2. Assign PE & Life Skills
    const pe = getSubjectByName("P.E");
    const life = getSubjectByName("LIFESKILLS");
    const peTeacher = pe?.teachers[0];
    const lifeTeacher = life?.teachers[0];

    for (const [subject, teacher] of [
      [pe, peTeacher],
      [life, lifeTeacher],
    ]) {
      if (!subject || !teacher) continue;
      outer: for (const day of DAYS) {
        for (let slot = 0; slot < 10; slot++) {
          if (
            isSlotFree(classSchedule, day, slot) &&
            isSlotFree(teacherSchedule, day, slot, teacher.id)
          ) {
            assignLesson(day, slot, subject, teacher);
            break outer;
          }
        }
      }
    }

    // 3. Assign double lessons (3 days)
    const otherSubjects = shuffle(
      subjects.filter(
        (s) => !["P.E", "LIFESKILLS"].includes(s.subjectName.toUpperCase())
      )
    );
    let doubleDays = 0;

    for (const day of shuffle(DAYS)) {
      for (let slot = 0; slot < 9; slot++) {
        const subject = otherSubjects[doubleDays % otherSubjects.length];
        const teacher = subject.teachers[0];
        if (!teacher) continue;

        if (
          isSlotFree(classSchedule, day, slot) &&
          isSlotFree(classSchedule, day, slot + 1) &&
          isSlotFree(teacherSchedule, day, slot, teacher.id) &&
          isSlotFree(teacherSchedule, day, slot + 1, teacher.id)
        ) {
          assignLesson(day, slot, subject, teacher, true);
          assignLesson(day, slot + 1, subject, teacher, true);
          doubleDays++;
          break;
        }
      }
      if (doubleDays >= 3) break;
    }

    // 4. Assign remaining lessons to each subject (min 6/week)
    for (const subject of subjects) {
      const teacher = subject.teachers[0];
      if (!teacher) continue;
      let assigned = timetableEntries.filter(
        (e) => e.subjectId === subject.id
      ).length;

      for (const day of shuffle(DAYS)) {
        for (let slot = 0; slot < 10; slot++) {
          if (assigned >= 6) break;
          if (
            isSlotFree(classSchedule, day, slot) &&
            isSlotFree(teacherSchedule, day, slot, teacher.id)
          ) {
            assignLesson(day, slot, subject, teacher);
            assigned++;
          }
        }
      }
    }

    // Save timetable for the class
    const timetable = await prisma.timetable.create({
      data: {
        classId: classObj.id,
        entries: {
          create: timetableEntries
            .filter((entry) => entry.teacherId) // Filter out entries with missing teacherId
            .map((entry) => ({
              weekday: entry.weekday,
              subjectName: entry.subjectName, // Use subjectName instead of subjectId
              teacherId: entry.teacherId,
              teacherName: entry.teacherName, // Include teacher name
              ClassName: entry.ClassName, // Include class name
              startTime: entry.startTime,
              endTime: entry.endTime,
              isDouble: entry.isDouble,
            })),
        },
      },
      include: {
        entries: {
          include: {
            teacher: true,
            subject: true,
          },
        },
      },
    });
    allTimetables.push({
      ...timetable,
      entries: timetable.entries.map((entry) => ({
        weekday: entry.weekday,
        subjectName: entry.subjectName, // Include subject name in the response
        teacherName: entry.teacher.teacherName || "Unknown", // Handle missing teacher gracefully
        ClassName: entry.ClassName, // Include class name in the response
        startTime: entry.startTime,
        endTime: entry.endTime,
        isDouble: entry.isDouble,
      })),
    });
  }

  return allTimetables;
}

export default { generateTimetableForAllClasses };
