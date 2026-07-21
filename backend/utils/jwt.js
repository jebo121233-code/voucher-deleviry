import jwt from 'jsonwebtoken';


export const createToken = (email) => {
    if (!email) {
        throw new Error('No email');
    }

    const secret = process.env.JWT_SECRET;
    const data = {email}
    const duration = 7 * 24 * 60 * 60;

    const token = jwt.sign(data, secret, {expiresIn: duration});

    return token;
}


export const verifyTokenAndReturnEmail = (token) => {
    if (!token) {
        throw new Error('No token');
    }
    const secret = process.env.JWT_SECRET;

    try {
        const decoded = jwt.verify(token, secret);
        if (!decoded.email) {
            throw new Error('No email');
        }
        return decoded.email;
    } catch (err) {
        throw new Error(err);
    }
}
