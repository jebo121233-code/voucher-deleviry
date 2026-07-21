const cleanUser = (user) => {
    const { password, id, createdAt, updatedAt, ...rest } = user.dataValues;
    return rest;
}

export default cleanUser;
