import bcrypt from 'bcrypt';

export const hashPassword = async (password) => {
    if (!password) {
        throw new Error('No password');
    }
    
    const saltRound = 10;
    
    const hashed = await bcrypt.hash(password, saltRound);
    
    return hashed;
}


export const checkPassword = async (password, userPassword) => {
    if (!password || !userPassword) {
        throw new Error('No password or userPassword');
    }

    const isValid = await bcrypt.compare(password, userPassword);

    return isValid;
}