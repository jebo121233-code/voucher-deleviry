import { Voucher, Store, Category } from "../models/db.js";


export const list = async (req, res) => {
    try {
        const { category_id } = req.query;
        const whereCondition = {};

        if (category_id) {
        whereCondition.category_id = category_id;
        }

        const vouchers = await Voucher.findAll({
        where: whereCondition,
        include: [
            {
            model: Store,
            as: 'store'
            },
            
            {
            model: Category,
            as: 'category'
            }
        ]
        });

        return res.status(200).send({ vouchers });

    } catch (err) {
        return res.status(400).send({ error: err.message });
    }
};


export const getVoucher = async (req, res) => {
    try {
        const voucher = req.voucher;

        if (!voucher) return res.status(400).send({ message: "Can't get voucher" });
        return res.status(200).send({
            voucher,
        });
    } catch (err) {
        return res.status(400).send({ error: err.message });
    }
}
