import * as service from '../services/adminServices.js';
import * as validate from '../utils/validateData.js';
import cleanUser from '../utils/cleanUser.js';

export const createAdmin = async (req, res) => {
    try {
        const { email } = req.body;
        const user = req.user;

        if (!email || !user) {
            return res.status(400).send({ err: "Can't create admin" });
        }

        const userToAdmin = await service.createAdminService(email);

        return res.status(200).send({
            message: 'User role changed to admin successfully',
            user: cleanUser(userToAdmin),
        });
    } catch (err) {
        return res.status(400).send({ error: err.message, });
    }
}


export const getUsers = async (req, res) => {
    try {
        const users = await service.getUsersService();

        if (!users) {
            return res.status(400).send({ err: "No user" });
        }

        return res.status(200).send({
            users,
        });
    } catch (err) {
        return res.status(400).send({ error: err.message, });
    }
}


export const deleteUser = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) return res.status(400).send({ err: "No email" });

        await service.deleteUserService(email);

        return res.status(200).send({
            message: "User deleted successfully",
        });
    } catch (err) {
        return res.status(400).send({ error: err.message, });
    }
}


export const createVoucher = async (req, res) => {
    try {
        const {
            percentage,
            price,
            discount,
            max_val,
            min_val,
            quantity,
            storeId,
            description,
            name,
        } = req.body;

        const data = {percentage, price, discount, min_val, max_val, quantity, storeId, description, name};

        validate.validateVoucher(data);

        const voucher = await service.createVoucherService(data);

        if (!voucher) return res.status(400).send({ err: "Can't create voucher" });

        return res.status(201).send({
            message: "Voucher created successfully",
            voucher,
        });
    } catch (err) {
        return res.status(400).send({ error: err.message, });
    }
}


export const updateVoucher = async (req, res) => {
    try {
        const voucher = req.voucher;
        const {
            percentage,
            price,
            discount,
            max_val,
            min_val,
            quantity,
            storeId,
            description,
            name,
        } = req.body;

        if (!voucher) return res.status(400).send({ err: "Can't get voucher" });
        
        const data = {percentage, price, discount, min_val, max_val, quantity, storeId, description, name};
        
        
        const newVoucher = await service.updateVoucherService(voucher, data);
        if (!newVoucher) return res.status(400).send({ err: "Can't update voucher" });

        return res.status(200).send({
            message: "Voucher updated successfully",
            voucher: newVoucher,
        })
    } catch (err) {
        return res.status(400).send({ error: err.message, });
    }
}


export const deleteVoucher = async (req, res) => {
    try {
        const voucher = req.voucher;
        if (!voucher) return res.status(400).send({ err: "Can't get voucher" });

        await voucher.destroy();

        return res.status(200).send({
            message: "Voucher deleted successfully",
        });
    } catch (err) {
        return res.status(400).send({ error: err.message, });
    }
}
