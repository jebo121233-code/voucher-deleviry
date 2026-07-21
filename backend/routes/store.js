import express from 'express';
import * as StoreController from '../controller/storeController.js';
import * as middleware from '../utils/middlewares.js';

const router = express.Router();

// all routes used are here
router.get("/list", StoreController.listStores);
router.get("/:id", StoreController.getStoreById);

export default router;