import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import prisma from '../client';
import { ApiError } from '../middlewares/error';
import { Role, User } from '@prisma/client';

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody: any) => {
  if (await isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const hashedPassword = await bcrypt.hash(userBody.password, 8);

  const user = await prisma.user.create({
    data: {
      ...userBody,
      password: hashedPassword,
    },
  });

  return user;
};

const isEmailTaken = async (email: string, excludeUserId?: number): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (excludeUserId && user?.id === excludeUserId) {
    return false;
  }

  return !!user;
};

const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id: number) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

const apiCreateUser = async (userBody: any) => {
  return createUser(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<Object>}
 */
const queryUsers = async (filter: any, options: any) => {
  // Basic filter implementation
  const where: any = {};
  if (filter.role) where.role = filter.role;
  if (filter.name) where.name = { contains: filter.name, mode: 'insensitive' };

  // Pagination
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const skip = (page - 1) * limit;

  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: options.sortBy ? { [options.sortBy]: 'asc' } : { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }, // Exclude password
  });

  const totalResults = await prisma.user.count({ where });
  const totalPages = Math.ceil(totalResults / limit);

  return { users, page, limit, totalPages, totalResults };
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId: number, updateBody: any) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  // If password is being updated, hash it
  if (updateBody.password) {
    updateBody.password = await bcrypt.hash(updateBody.password, 8);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateBody,
  });
  return updatedUser;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId: number) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await prisma.user.delete({ where: { id: userId } });
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
