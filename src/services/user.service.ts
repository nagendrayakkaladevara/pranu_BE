
import httpStatus from 'http-status';
import User from '../models/user.model';
import { ApiError } from '../middlewares/error';

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody: any) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return User.create(userBody);
};

const isEmailTaken = async (email: string, excludeUserId?: string): Promise<boolean> => {
  return User.isEmailTaken(email, excludeUserId);
};

const getUserByEmail = async (email: string) => {
  return User.findOne({ email, isDeleted: { $ne: true } });
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id: string) => {
  return User.findOne({ _id: id, isDeleted: { $ne: true } });
};

const apiCreateUser = async (userBody: any) => {
  return createUser(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Simple filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option (e.g. name:asc)
 * @param {number} [options.limit] - Limit per page
 * @param {number} [options.page] - Page number
 * @returns {Promise<Object>}
 */
const queryUsers = async (filter: any, options: any) => {
  const where: any = { isDeleted: { $ne: true } };
  if (filter.role) where.role = filter.role;
  if (filter.name) where.name = { $regex: filter.name, $options: 'i' };

  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  let sort = '';
  if (options.sortBy) {
    const parts = options.sortBy.split(':');
    sort = parts[0] + (parts[1] === 'desc' ? ' -' : ''); // Approximation, mongoose syntax string 'field' or '-field'
    // Better: sort object { field: 1/-1 }
    // If input is "field:asc/desc"
    const [field, order] = options.sortBy.split(':');
    sort = (order === 'desc' ? '-' : '') + field;
  } else {
    sort = '-createdAt';
  }

  const users = await User.find(where)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select('-password');

  const totalResults = await User.countDocuments(where);
  const totalPages = Math.ceil(totalResults / limit);

  return { users, page, limit, totalPages, totalResults };
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId: string, updateBody: any) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  // Assign updates
  Object.assign(user, updateBody);
  // Saving triggers pre-save hook for password hashing
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId: string) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  user.isDeleted = true;
  user.deletedAt = new Date();
  await user.save();
  return user;
};

export default {
  createUser,
  apiCreateUser,
  isEmailTaken,
  getUserByEmail,
  getUserById,
  queryUsers,
  updateUserById,
  deleteUserById,
};
