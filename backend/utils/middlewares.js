import { getUserFromAuth } from './auth.js';
import { Voucher, Store } from '../models/db.js';

export const AuthRequest = async (req, res, next) => {
    try {
        const auth = req.get('Authorization');
        
        if (!auth) {
            return res.status(401).send({error: "Unauthorized"});
        }
    
        req.user = await getUserFromAuth(auth);
        next()
    } catch (err) {
        return res.status(401).send({error: "Unauthorized"});
    }
}


export const AdminAuth = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).send({ error: 'Unauthorized' });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).send({
                error: 'Forbidden: Admins only',
            });
        }
        next();
    } catch (err) {
        return res.status(403).send({
            error: "Forbidden",
        });
    }
}



export const getVoucher = async (req, res, next) => {
    try {
        const { id } = req.params;
    
        if (!id) return res.status(400).send({err: "No voucher id"});
    
        const voucher = await Voucher.findOne({
            where: {id,},
            include: [
                {
                    model: Store,
                    as: 'store'
                }
            ],
        });
    
        if (!voucher) return res.status(400).send({err: "No voucher found"});
    
        req.voucher = voucher;
        next();
    } catch (err) {
        return res.status(401).send({error: err.message});
    }
}
