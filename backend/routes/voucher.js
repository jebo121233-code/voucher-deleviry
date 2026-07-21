import express from 'express';
import * as middleware from '../utils/middlewares.js';
import * as VoucherController from '../controller/voucherController.js';

const router = express.Router();

// all routes used are here
router.get('/list', VoucherController.list);
router.get('/getVoucher/:id', middleware.getVoucher, VoucherController.getVoucher);

export default router;