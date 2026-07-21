export const validateName = (name) => {
    if (!name || name === '' || name.length < 2) {
        throw new Error('Name error');
    }
}


export const validateAge = (age) => {
    if (!age || age === '') {
        throw new Error('Age error');
    }
    
    const numAge = Number(age);
    if (isNaN(numAge) || numAge < 1 || numAge > 100) {
        throw new Error('Age error');
    }
}



export const validateEmail = (email) => {
    if (!email || email === '') {
        throw new Error('Email error');
    }
    
    const regex = /^[^\s@]+@(gmail|yahoo|outlook|email)\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
    
    if (!regex.test(email)) {
        throw new Error('Email error');
    }
}



export const validatePassword = (password) => {
    if (!password || password === '') {
        throw new Error('Password error');
    }
    
    const regex = /^(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{7,}$/;
    if (!regex.test(password)) {
        throw new Error('Password error');
    }
}



export const validateGender = (gender) => {
    if (!gender || gender === '') {
        throw new Error('Gender error');
    }
    
    const allowedGenders = ["male", "female"];
    
    if (!allowedGenders.includes(gender.toLowerCase())) {
        throw new Error('Gender error');
    }
}



export const validatePhone = (phone) => {
    if (!phone || phone === '') {
        throw new Error('Phone error');
    }
    
    const regex = /^(\+2)?01[0125][0-9]{8}$/;
    if (!regex.test(phone)) {
        throw new Error('Phone error');
    }
}


export const validateUserData = (userData) => {
    try {
        validateAge(userData.age);
        validateName(userData.name);
        validatePhone(userData.phone);
        validateEmail(userData.email);
        validatePassword(userData.password);
        validateGender(userData.gender);
    } catch (err) {
        throw new Error(err)
    }
}


export const validateVoucher = (data) => {
    if (!data) throw new Error ('No data');

    if (
        !data.name ||
        !data.storeId ||
        !data.price ||
        !data.quantity
    ) throw new Error ('Missed Important data');

    const hasPercentage = data.percentage !== undefined && data.percentage !== null;
    const hasDiscount = data.discount !== undefined && data.discount !== null;

    if (hasPercentage === hasDiscount) {
        throw new Error(
            "You must provide either percentage or discount, but not both"
        );
    }
}
