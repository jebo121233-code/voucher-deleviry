import express from 'express';
import * as UserController from '../controller/userController.js';
import * as middleware from '../utils/middlewares.js';

const router = express.Router();

// all routes used are here
router.post('/createUser', UserController.createUser);
router.get('/getUser', middleware.AuthRequest, UserController.getUser);
router.post('/login', UserController.Login);
router.put('/updateUser',middleware.AuthRequest, UserController.updateUser);
router.delete('/deleteUser',middleware.AuthRequest, UserController.deleteUser);
router.put('/changePassword',middleware.AuthRequest, UserController.changePassword);

export default router;