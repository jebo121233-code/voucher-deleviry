import { Category } from "../models/db.js";


export const listCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        return res.status(200).json({ categories });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};