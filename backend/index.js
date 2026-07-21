import express, {json, urlencoded} from 'express';
import router from './routes/index.js';
import logger from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import dotenv from 'dotenv';
dotenv.config();

const port = process.env.PORT || 5000;

const app = express();
app.use(logger('dev'));
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/api', router);

app.listen(port, () => {
  console.log(`Server working on port ${port}`);
});

export default app;