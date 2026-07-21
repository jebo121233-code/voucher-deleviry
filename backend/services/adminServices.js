import * as auth from '../utils/auth.js';
import { User, Voucher } from '../models/db.js';

export const createAdminService = async (email) => {
    try {
        const user = await auth.getUserByEmail(email);

        if (!user) {
            throw new Error("Can't find user");
        }

        user.role = 'admin';
        await user.save()

        return user;
    } catch (err) {
        throw err;
    }
}


export const getUsersService = async () => {
    const users = User.findAll()

    if (!users) {
        throw ("Can't get users");
    }

    return users;
}


export const deleteUserService = async (email) => {
    if (!email) throw new Error("No email");

    const deleted = await User.destroy({
        where: { email },
    });

    if (!deleted) {
        throw new Error("User not found");
    }

    return true;
}


export const createVoucherService = async (data) => {
    if (!data) throw new Error ('No data');

    const voucher = Voucher.create ({
        ...data,
    });

    if (!voucher) throw new Error ("Can't create voucher");

    return voucher;
}


export const updateVoucherService = async (voucher, data) => {
    if (!data || !voucher) throw new Error ('No data or voucher');

    const fieldToUpdate = [
        'name', 
        'percentage', 
        'price',
        'discount',
        'max_val',
        'min_val',
        'quantity',
        'storeId',
        'description'
    ];

    fieldToUpdate.forEach((field) => {
        if(data[field]) {
            voucher[field] = data[field];
        }
    });

    await voucher.save();

    return voucher;
}
