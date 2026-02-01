import httpStatus from 'http-status';
import prisma from '../client';
import { ApiError } from '../middlewares/error';

const createClass = async (classBody: any) => {
  return prisma.class.create({
    data: classBody,
  });
};

const queryClasses = async (filter: any, options: any) => {
  const where: any = {};
  if (filter.name) where.name = { contains: filter.name, mode: 'insensitive' };
  if (filter.department) where.department = { contains: filter.department, mode: 'insensitive' };

  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  const classes = await prisma.class.findMany({
    where,
    skip,
    take: limit,
    orderBy: options.sortBy ? { [options.sortBy]: 'asc' } : { createdAt: 'desc' },
    include: {
      _count: {
        select: { students: true, lecturers: true },
      },
    },
  });

  const totalResults = await prisma.class.count({ where });
  const totalPages = Math.ceil(totalResults / limit);

  return { classes, page, limit, totalPages, totalResults };
};

const getClassById = async (id: number) => {
  return prisma.class.findUnique({
    where: { id },
    include: {
      students: {
        include: {
          student: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      lecturers: {
        include: {
          lecturer: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });
};

const updateClassById = async (classId: number, updateBody: any) => {
  const classData = await getClassById(classId);
  if (!classData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }
  const updatedClass = await prisma.class.update({
    where: { id: classId },
    data: updateBody,
  });
  return updatedClass;
};

const deleteClassById = async (classId: number) => {
  const classData = await getClassById(classId);
  if (!classData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }
  await prisma.class.delete({ where: { id: classId } });
  return classData;
};

const assignStudentsToClass = async (classId: number, studentIds: number[]) => {
  const classData = await getClassById(classId);
  if (!classData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }

  // Verify all students exist and are actually students
  const students = await prisma.user.findMany({
    where: {
      id: { in: studentIds },
      role: 'STUDENT',
    },
  });

  if (students.length !== studentIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more user IDs are invalid or not students');
  }

  // Transaction to create assignments
  // Prisma createMany for many-to-many pivots is tricky if duplicates exist.
  // Ideally we ignore duplicates.

  // We'll map and try to create, or use a loop. Since createMany skipDuplicates is safer.
  const data = studentIds.map((sId) => ({
    classId,
    studentId: sId,
  }));

  await prisma.classStudent.createMany({
    data,
    skipDuplicates: true,
  });

  return getClassById(classId);
};

const assignLecturersToClass = async (classId: number, lecturerIds: number[]) => {
  const classData = await getClassById(classId);
  if (!classData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }

  const lecturers = await prisma.user.findMany({
    where: {
      id: { in: lecturerIds },
      role: 'LECTURER',
    },
  });

  if (lecturers.length !== lecturerIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more user IDs are invalid or not lecturers');
  }

  const data = lecturerIds.map((lId) => ({
    classId,
    lecturerId: lId,
  }));

  await prisma.classLecturer.createMany({
    data,
    skipDuplicates: true,
  });

  return getClassById(classId);
};

export default {
  createClass,
  queryClasses,
  getClassById,
  updateClassById,
  deleteClassById,
  assignStudentsToClass,
  assignLecturersToClass,
};
