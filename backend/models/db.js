import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const db = require('./index.cjs');

export const { User, Voucher, UserVouchers, Store, Category } = db;
export default db;