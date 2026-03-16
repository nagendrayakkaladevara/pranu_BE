import httpStatus from 'http-status';
import Circular from '../models/circular.model';
import Class from '../models/class.model';
import { ApiError } from '../middlewares/error';
import { CircularType, TargetType } from '../models/circular.model';

/**
 * Create a circular/notice/announcement
 * @param circularBody - Circular data
 * @param lecturerId - ID of the publishing lecturer
 * @returns Created circular
 */
const createCircular = async (circularBody: any, lecturerId: string) => {
  const body = { ...circularBody, publishedBy: lecturerId };

  if (body.targetType === TargetType.CLASS && !body.targetClassId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'targetClassId is required when targetType is CLASS');
  }
  if (body.targetType === TargetType.DEPARTMENT && !body.targetDepartment) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'targetDepartment is required when targetType is DEPARTMENT',
    );
  }

  return Circular.create(body);
};

/**
 * Query circulars with filters and pagination
 * @param filter - Filter options
 * @param options - Pagination and sort options
 * @param userId - Current user ID (for student visibility)
 * @param userRole - Current user role
 * @returns Paginated list of circulars
 */
const queryCirculars = async (filter: any, options: any, userId: string, userRole: string) => {
  const where: any = {};

  if (filter.type) where.type = filter.type;
  if (filter.targetType) where.targetType = filter.targetType;
  if (filter.targetClassId) where.targetClassId = filter.targetClassId;
  if (filter.targetDepartment) where.targetDepartment = { $regex: filter.targetDepartment, $options: 'i' };
  if (filter.priority) where.priority = filter.priority;
  if (filter.isPinned !== undefined) where.isPinned = filter.isPinned;

  // Students only see circulars relevant to them
  if (userRole === 'STUDENT') {
    const studentClasses = await Class.find({ students: userId }).select('_id department');
    const classIds = studentClasses.map((c) => c._id);
    const departments = [...new Set(studentClasses.map((c) => c.department))];

    where.$or = [
      { targetType: TargetType.ALL },
      { targetType: TargetType.CLASS, targetClassId: { $in: classIds } },
      { targetType: TargetType.DEPARTMENT, targetDepartment: { $in: departments } },
    ];
  }

  // Lecturers see their own + all (or filter by their classes)
  if (userRole === 'LECTURER' && filter.myOnly) {
    where.publishedBy = userId;
  }

  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  let sort = '-isPinned -createdAt';
  if (options.sortBy) {
    const [field, order] = options.sortBy.split(':');
    sort = (order === 'desc' ? '-' : '') + field;
  }

  const circulars = await Circular.find(where)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('publishedBy', 'id name email')
    .populate('targetClassId', 'id name department');

  const totalResults = await Circular.countDocuments(where);
  const totalPages = Math.ceil(totalResults / limit);

  return { circulars, page, limit, totalPages, totalResults };
};

/**
 * Get circular by ID
 * @param circularId - Circular ID
 * @param userId - Current user ID (for student visibility check)
 * @param userRole - Current user role
 * @returns Circular or null
 */
const getCircularById = async (circularId: string, userId: string, userRole: string) => {
  const circular = await Circular.findById(circularId)
    .populate('publishedBy', 'id name email')
    .populate('targetClassId', 'id name department');

  if (!circular) return null;

  // Students: verify they have access
  if (userRole === 'STUDENT') {
    const studentClasses = await Class.find({ students: userId }).select('_id department');
    const classIds = studentClasses.map((c) => c._id);
    const departments = studentClasses.map((c) => c.department);

    const hasAccess =
      circular.targetType === TargetType.ALL ||
      (circular.targetType === TargetType.CLASS &&
        circular.targetClassId &&
        classIds.some((id) => id.equals(circular.targetClassId))) ||
      (circular.targetType === TargetType.DEPARTMENT &&
        circular.targetDepartment &&
        departments.includes(circular.targetDepartment));

    if (!hasAccess) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You do not have access to this circular');
    }
  }

  return circular;
};

/**
 * Update circular by ID (lecturer who created it only)
 * @param circularId - Circular ID
 * @param updateBody - Fields to update
 * @param lecturerId - ID of the lecturer making the request
 * @returns Updated circular
 */
const updateCircularById = async (
  circularId: string,
  updateBody: any,
  lecturerId: string,
) => {
  const circular = await Circular.findById(circularId);
  if (!circular) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Circular not found');
  }
  if (!circular.publishedBy.equals(lecturerId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update circulars you published');
  }

  Object.assign(circular, updateBody);
  await circular.save();
  await circular.populate(['publishedBy', 'targetClassId']);
  return circular;
};

/**
 * Delete circular by ID (lecturer who created it only)
 * @param circularId - Circular ID
 * @param lecturerId - ID of the lecturer making the request
 */
const deleteCircularById = async (circularId: string, lecturerId: string) => {
  const circular = await Circular.findById(circularId);
  if (!circular) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Circular not found');
  }
  if (!circular.publishedBy.equals(lecturerId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete circulars you published');
  }
  await circular.deleteOne();
};

export default {
  createCircular,
  queryCirculars,
  getCircularById,
  updateCircularById,
  deleteCircularById,
};
