import * as validate from '../utils/validateData.js';
import * as userServices from '../services/userServices.js';
import cleanUser from '../utils/cleanUser.js';

export const createUser = async(req, res) => {
    try {
        const { name, age, gender, phone, email, password } = req.body;
        const userData = { name, age, gender, phone, email, password };

        validate.validateUserData(userData);

        const { token, user } = await userServices.createUserService(userData);

        return res.status(201).send({
            message: "User created successfully",
            token,
            user: cleanUser(user),
        });
    } catch (err) {
        return res.status(400).send({ error: err.message })
    }
}


export const getUser = (req, res) => {
    try {
        if (!req.user) {
            return res.status(400).send({ error: "No user" });
        }

        return res.status(200).send(cleanUser(req.user));
    } catch (err) {
        return res.status(400).send({ error: err.message })
    }
}


export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;
        validate.validateEmail(email);
        validate.validatePassword(password);

        const { token, user } = await userServices.loginService(email, password);

        return res.status(200).send({
            message: "login successfully",
            token,
            user: cleanUser(user)
        });
    } catch (err) {
        return res.status(400).send({ error: err.message })
    }
}


export const updateUser = async (req, res) => {
    try {
        const user = req.user;
        const { name, phone } = req.body;

        if (name) validate.validateName(name);
        if (phone) validate.validatePhone(phone);

        const updatedUser = await userServices.updateUserService(user, { name, phone });

        return res.status(200).send({
            message: "User updated successfully",
            user: cleanUser(updatedUser),
        });
    } catch (err) {
        return res.status(400).send({ error: err.message })
    }
}


export const deleteUser = async (req, res) => {
    try {
        const user = req.user;
        
        await userServices.deleteUserService(user);

        return res.status(200).send({
            message: 'User deleted successfully',
        });
    } catch (err) {
        return res.status(400).send({ error: err.message })
    }
}



export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body
        const user = req.user;

        if (!oldPassword || !newPassword || !user) {
            throw new Error('Missing data');
        }

        validate.validatePassword(newPassword);
        
        await userServices.changePasswordUserService(user, oldPassword, newPassword);

        return res.status(200).send({
            message: 'User password changed successfully',
        });
    } catch (err) {
        return res.status(400).send({ error: err.message })
    }
}

