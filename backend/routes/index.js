import express from 'express';
import userRouter from './user.js';
import adminRouter from './admin.js';
import voucherRouter from './voucher.js';
import storeRouter from './store.js';
import categoryRouter from './category.js';

const router = express.Router();

router.use('/user', userRouter);
router.use('/admin', adminRouter);
router.use('/voucher', voucherRouter);
router.use('/store', storeRouter);
router.use('/category', categoryRouter);


export default router;