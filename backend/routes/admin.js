import express from 'express';
import * as AdminController from '../controller/adminController.js';
import * as middleware from '../utils/middlewares.js';

const router = express.Router();

// all routes used are here

// user apis are here
router.post('/createAdmin', middleware.AuthRequest, middleware.AdminAuth, AdminController.createAdmin);
router.get('/getUsers', middleware.AuthRequest, middleware.AdminAuth, AdminController.getUsers);
router.delete('/deleteUser',middleware.AuthRequest, middleware.AdminAuth, AdminController.deleteUser);

// voucher apis are here
router.post('/createVoucher', middleware.AuthRequest, middleware.AdminAuth, AdminController.createVoucher)
router.put('/updateVoucher/:id', middleware.AuthRequest, middleware.AdminAuth, middleware.getVoucher, AdminController.updateVoucher)
router.delete('/deleteVoucher/:id', middleware.AuthRequest, middleware.AdminAuth, middleware.getVoucher, AdminController.deleteVoucher)

export default router;