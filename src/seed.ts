import User, { Role } from './models/user.model';
import logger from './config/logger';

const seedAdmin = async () => {
  const adminEmail = 'admin@admin.com';
  const exists = await User.findOne({ email: adminEmail });
  if (exists) {
    logger.info('Admin user already exists, skipping seed');
    return;
  }

  await User.create({
    email: adminEmail,
    password: 'admin123',
    name: 'Admin',
    role: Role.ADMIN,
  });

  logger.info('Admin user seeded (admin@admin.com / admin123)');
};

export default seedAdmin;
