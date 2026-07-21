import { User } from '../models/db.js';
import * as jwt from './jwt.js';

export const getUserByEmail = async(email) =>{
    if (!email) {
        throw new Error('No email');
    }

    try {
        const user = await User.findOne({
            where: {
                email,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }
        return user;
    } catch (err) {
        throw new Error(err)
    }
}

export const getUserFromAuth = async(auth) => {
    if (!auth) {
        throw new Error("Unauthorized");
    }

    if (auth.slice(0, 7) !== "Bearer ") {
        throw new Error("Unauthorized");
    }

    const token = auth.replace('Bearer ', '');

    try {
        const email = jwt.verifyTokenAndReturnEmail(token);

        const user = await getUserByEmail(email);

        return user;
    } catch (err) {
        throw new Error (err)
    }
}
