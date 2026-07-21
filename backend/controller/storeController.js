import { Store, Voucher, Category } from '../models/db.js';

export const listStores = async (req, res) => {
    try {
        const { category_id } = req.query;

        const whereCondition = {};

        if (category_id) {
        whereCondition.category_id = category_id;
        }

        const stores = await Store.findAll({
        where: whereCondition
        });

        return res.status(200).json({ stores });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

export const getStoreById = async (req, res) => {
    try {
        const store = await Store.findOne({
            where: {id: req.params.id},
            include: [
                {
                    model: Voucher,
                    as: 'vouchers',
                },

                {
                    model: Category,
                    as: 'category',
                }
            ]

        });
        const vouchers = await Voucher.findAll({
            where: { storeId: store.id }
        });
        if (!store) return res.status(404).json({ message: "Store not found" });
        return res.status(200).send({ store });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
