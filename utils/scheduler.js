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
  const assignments = await prisma.subjectTeacher.findMany({
    include: {
      teacher: true,
      subject: true,
    },
  });

  const allTimetables = [];
  const teacherSchedule = {};

  for (const day of DAYS) {
    teacherSchedule[day] = {};
    for (const a of assignments) {
      teacherSchedule[day][a.teacherName] = [];
    }
  }

  const getAssigned = (subjectName, className) =>
    assignments.find(
      (a) =>
        a.subject.subjectName.toUpperCase() === subjectName.toUpperCase() &&
        a.ClassName === className
    );

  const isSlotFree = (schedule, day, slot, teacherId = null) => {
    if (!schedule[day]) schedule[day] = teacherId ? {} : [];
    if (teacherId) {
      if (!schedule[day][teacherId]) schedule[day][teacherId] = [];
      return !schedule[day][teacherId].includes(slot);
    }
    return !schedule[day].some((s) => s.slot === slot);
  };

  const assignLesson = (
    day,
    slot,
    subject,
    teacher,
    classObj,
    classSchedule,
    timetableEntries,
    subjectPerDay,
    double = false
  ) => {
    const { start, end } = getTimeRange(slot);
    classSchedule[day].push({ slot, subjectName: subject.subjectName });
    teacherSchedule[day][teacher.teacherName].push(slot);
    if (!double) subjectPerDay[day].add(subject.subjectName);
    timetableEntries.push({
      weekday: day,
      subjectName: subject.subjectName,
      teacherId: teacher.id,
      teacherName: teacher.teacherName,
      ClassName: classObj.ClassName,
      startTime: start,
      endTime: end,
      isDouble: double,
    });
  };

  for (const classObj of classes) {
    const classSchedule = {};
    const subjectPerDay = {};
    const timetableEntries = [];
    for (const day of DAYS) {
      classSchedule[day] = [];
      subjectPerDay[day] = new Set();
    }

    const comboPairs = [
      ["AGRIC", "BST"],
      ["Physics", "CRE"],
      ["GEOGRAPHY", "HISTORY"],
    ];

    if (
      classObj.ClassName === "Form Three" ||
      classObj.ClassName === "Form Four"
    ) {
      for (const [s1Name, s2Name] of comboPairs) {
        const a1 = getAssigned(s1Name, classObj.ClassName);
        const a2 = getAssigned(s2Name, classObj.ClassName);
        if (!a1 || !a1.teacher || !a2 || !a2.teacher) continue;

        let assignedCount = 0;

        const daysSlots = shuffle(
          DAYS.flatMap((day) =>
            Array.from({ length: 10 }, (_, slot) => ({ day, slot }))
          )
        );

        for (const { day, slot } of daysSlots) {
          if (
            !subjectPerDay[day].has(a1.subject.subjectName) &&
            !subjectPerDay[day].has(a2.subject.subjectName) &&
            isSlotFree(classSchedule, day, slot) &&
            isSlotFree(teacherSchedule, day, slot, a1.teacher.teacherName) &&
            isSlotFree(teacherSchedule, day, slot, a2.teacher.teacherName)
          ) {
            assignLesson(
              day,
              slot,
              a1.subject,
              a1.teacher,
              classObj,
              classSchedule,
              timetableEntries,
              subjectPerDay
            );
            assignLesson(
              day,
              slot,
              a2.subject,
              a2.teacher,
              classObj,
              classSchedule,
              timetableEntries,
              subjectPerDay
            );
            assignedCount++;
          }
          if (assignedCount >= 6) break;
        }

        if (assignedCount < 4) {
          console.warn(
            `Only ${assignedCount} lessons could be scheduled for combo pair ${s1Name} & ${s2Name} in ${classObj.ClassName}`
          );
        }
      }
    }

    const singleWeekSubjects = ["P.E", "LIFE SKILLS"];
    for (const subjName of singleWeekSubjects) {
      const a = getAssigned(subjName, classObj.ClassName);
      if (!a || !a.teacher) continue;

      let assigned = false;
      const daySlotPairs = shuffle(
        DAYS.flatMap((day) => SLOT_TIMES.map((_, slot) => ({ day, slot })))
      );

      for (const { day, slot } of daySlotPairs) {
        if (
          !subjectPerDay[day].has(a.subject.subjectName) &&
          isSlotFree(classSchedule, day, slot) &&
          isSlotFree(teacherSchedule, day, slot, a.teacher.teacherName)
        ) {
          assignLesson(
            day,
            slot,
            a.subject,
            a.teacher,
            classObj,
            classSchedule,
            timetableEntries,
            subjectPerDay
          );
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        console.warn(
          `Unable to schedule ${subjName} for ${classObj.ClassName}`
        );
      }
    }

    const otherAssignments = shuffle(
      assignments.filter(
        (a) =>
          !singleWeekSubjects.includes(a.subject.subjectName.toUpperCase()) &&
          !comboPairs.flat().includes(a.subject.subjectName.toUpperCase()) &&
          a.ClassName === classObj.ClassName
      )
    );

    let doubleLessons = 0;
    for (const day of shuffle(DAYS)) {
      for (let slot = 0; slot < 9; slot++) {
        const a = otherAssignments[doubleLessons % otherAssignments.length];
        if (!a || !a.teacher) continue;

        if (
          !subjectPerDay[day].has(a.subject.subjectName) &&
          isSlotFree(classSchedule, day, slot) &&
          isSlotFree(classSchedule, day, slot + 1) &&
          isSlotFree(teacherSchedule, day, slot, a.teacher.teacherName) &&
          isSlotFree(teacherSchedule, day, slot + 1, a.teacher.teacherName)
        ) {
          assignLesson(
            day,
            slot,
            a.subject,
            a.teacher,
            classObj,
            classSchedule,
            timetableEntries,
            subjectPerDay,
            true
          );
          assignLesson(
            day,
            slot + 1,
            a.subject,
            a.teacher,
            classObj,
            classSchedule,
            timetableEntries,
            subjectPerDay,
            true
          );
          doubleLessons++;
          break;
        }
      }
      if (doubleLessons >= 3) break;
    }

    for (const a of otherAssignments) {
      let assigned = timetableEntries.filter(
        (e) =>
          e.subjectName === a.subject.subjectName &&
          e.teacherName === a.teacher.teacherName
      ).length;

      for (const day of shuffle(DAYS)) {
        for (let slot = 0; slot < 10; slot++) {
          if (assigned >= 6) break;
          if (
            !subjectPerDay[day].has(a.subject.subjectName) &&
            isSlotFree(classSchedule, day, slot) &&
            isSlotFree(teacherSchedule, day, slot, a.teacher.teacherName)
          ) {
            assignLesson(
              day,
              slot,
              a.subject,
              a.teacher,
              classObj,
              classSchedule,
              timetableEntries,
              subjectPerDay
            );
            assigned++;
          }
        }
        if (assigned >= 6) break;
      }
    }

    const timetable = await prisma.timetable.create({
      data: {
        classId: classObj.id,
        entries: {
          create: timetableEntries.map((entry) => ({
            weekday: entry.weekday,
            subjectName: entry.subjectName,
           //teacherId: entry.teacherId,
            teacherName: entry.teacherName,
            ClassName: entry.ClassName,
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
        subjectName: entry.subjectName,
        teacherName: entry.teacher?.teacherName || "Unknown",
        ClassName: entry.ClassName,
        startTime: entry.startTime,
        endTime: entry.endTime,
        isDouble: entry.isDouble,
      })),
    });
  }

  return allTimetables;
}

export default { generateTimetableForAllClasses };
