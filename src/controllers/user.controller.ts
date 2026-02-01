import httpStatus from 'http-status';
import { Request, Response } from 'express';
import userService from '../services/user.service';
import catchAsync from '../utils/catchAsync';

const createUser = catchAsync(async (req: Request, res: Response) => {
    const user = await userService.apiCreateUser(req.body);
    res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req: Request, res: Response) => {
    const filter = {
        role: req.query.role ? String(req.query.role) : undefined,
        name: req.query.name ? String(req.query.name) : undefined,
    };
    const options = {
        limit: Number(req.query.limit) || 10,
        page: Number(req.query.page) || 1,
        sortBy: req.query.sortBy,
    };
    const result = await userService.queryUsers(filter, options);
    res.send(result);
});

const getUser = catchAsync(async (req: Request, res: Response) => {
    const user = await userService.getUserById(Number(req.params.userId));
    if (!user) {
        res.status(httpStatus.NOT_FOUND).send({ message: 'User not found' });
        return;
    }
    res.send(user);
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
    const user = await userService.updateUserById(Number(req.params.userId), req.body);
    res.send(user);
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
    await userService.deleteUserById(Number(req.params.userId));
    res.status(httpStatus.NO_CONTENT).send();
});

export default {
    createUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
};
