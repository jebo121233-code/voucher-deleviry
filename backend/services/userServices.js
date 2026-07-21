import { User } from '../models/db.js';
import * as jwt from '../utils/jwt.js';
import * as hash from '../utils/hash.js';


export const createUserService  = async (userData) => {
    try {
        const existUser = await User.findOne({
            where: { email: userData.email }
        });

        if (existUser) {
            throw new Error('Email already exists');
        }

        const hashedPassword = await hash.hashPassword(userData.password);

        userData.password = hashedPassword;
        
        const user = await User.create({
            ...userData,
        });

        const token = jwt.createToken(userData.email);

        return {
            token,
            user
        };
    } catch (err) {
        throw new Error(err)
    }
}


export const loginService = async(email, password) => {
    if (!email || !password) {
        throw new Error('Missing email or password');
    }
    
    const user = await User.findOne({
        where: { email }
    });
    
    if (!user) {
        throw new Error('No user found');
    }
    
    const isMatch = await hash.checkPassword(password, user.password);
    
    if (!isMatch) {
        throw new Error('Incorrect password');
    }

    const token = jwt.createToken(email);

    return {
        token,
        user,
    };
}


export const updateUserService = async (user, data) => {
    if (!user) {
        throw new Error("No user");
    }

    const fieldToUpdate = ['name', 'phone'];

    fieldToUpdate.forEach((field) => {
        if(data[field]) {
            user[field] = data[field];
        }
    });

    await user.save();

    return user;
}



export const deleteUserService = async (user) => {
    await user.destroy();
    return true;
};



export const changePasswordUserService = async (user, oldPassword, newPassword) => {
    try { 
        const isMatch = await hash.checkPassword(oldPassword, user.password);
        if (!isMatch) throw new Error('Password not match');
    
        const hashedPassword = await hash.hashPassword(newPassword);

        user.password = hashedPassword
        await user.save();

        return true;
    } catch (err) {
        throw new Error(err);
    }

}
