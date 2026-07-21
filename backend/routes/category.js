import express from 'express';
import * as CategoryController from '../controller/categoryController.js';

const router = express.Router();

// all routes used are here
router.get("/list", CategoryController.listCategories);

export default router;