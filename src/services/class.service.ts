
import httpStatus from 'http-status';
import Class from '../models/class.model';
import User from '../models/user.model';
import { ApiError } from '../middlewares/error';

/**
 * Create a class
 * @param {Object} classBody
 * @returns {Promise<Class>}
 */
const createClass = async (classBody: any) => {
  return Class.create(classBody);
};

/**
 * Query for classes
 * @param {Object} filter - Filter
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
const queryClasses = async (filter: any, options: any) => {
  const where: any = {};
  if (filter.name) where.name = { $regex: filter.name, $options: 'i' };
  if (filter.department) where.department = { $regex: filter.department, $options: 'i' };

  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  let sort = '-createdAt';
  if (options.sortBy) {
    const [field, order] = options.sortBy.split(':');
    sort = (order === 'desc' ? '-' : '') + field;
  }

  const classesDocs = await Class.find(where)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalResults = await Class.countDocuments(where);
  const totalPages = Math.ceil(totalResults / limit);

  // Map to match Prisma _count structure if possible, or just return docs
  // Prisma: include: { _count: { select: { students: true, lecturers: true } } }
  // Result has ._count.students
  const classes = classesDocs.map((doc) => {
    const obj = doc.toJSON();
    return {
      ...obj,
      _count: {
        students: doc.students.length,
        lecturers: doc.lecturers.length,
      },
    };
  });

  return { classes, page, limit, totalPages, totalResults };
};

/**
 * Get class by id
 * @param {string} id
 * @returns {Promise<Class>}
 */
const getClassById = async (id: string) => {
  const classDoc = await Class.findById(id)
    .populate('students', 'id name email')
    .populate('lecturers', 'id name email');

  if (!classDoc) return null;

  // Transform to match Prisma structure: students: [{ student: { ... } }]
  const obj = classDoc.toJSON();
  const students = (obj.students as any[]).map((s) => ({ student: s }));
  const lecturers = (obj.lecturers as any[]).map((l) => ({ lecturer: l }));

  return { ...obj, students, lecturers };
};

/**
 * Update class by id
 * @param {string} classId
 * @param {Object} updateBody
 * @returns {Promise<Class>}
 */
const updateClassById = async (classId: string, updateBody: any) => {
  const classDoc = await Class.findByIdAndUpdate(classId, updateBody, { new: true });
  if (!classDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }
  return classDoc;
};

/**
 * Delete class by id
 * @param {string} classId
 * @returns {Promise<Class>}
 */
const deleteClassById = async (classId: string) => {
  const classDoc = await Class.findByIdAndDelete(classId);
  if (!classDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }
  return classDoc;
};

const assignStudentsToClass = async (classId: string, studentIds: string[]) => {
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }

  // Verify students
  const count = await User.countDocuments({
    _id: { $in: studentIds },
    role: 'STUDENT',
  });

  if (count !== studentIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more user IDs are invalid or not students');
  }

  // Add using $addToSet to avoid duplicates
  await Class.updateOne(
    { _id: classId },
    { $addToSet: { students: { $each: studentIds } } }
  );

  return getClassById(classId);
};

const assignLecturersToClass = async (classId: string, lecturerIds: string[]) => {
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Class not found');
  }

  const count = await User.countDocuments({
    _id: { $in: lecturerIds },
    role: 'LECTURER',
  });

  if (count !== lecturerIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'One or more user IDs are invalid or not lecturers');
  }

  await Class.updateOne(
    { _id: classId },
    { $addToSet: { lecturers: { $each: lecturerIds } } }
  );

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
