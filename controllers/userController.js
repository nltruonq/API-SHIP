const User = require('../models/User');

const userController = {
    getAllUsers: async (req, res, next) => {
        try {
            const user = await User.find();
            return res.status(200).json(user);
        } catch (err) {
            res.status(500).json(err);
        }
    },

    deleteUser: async (req, res, next) => {
        try {
            const user = await User.findById(req.params.id);
            if (user) {
                return res.status(200).json('Delete successfully!');
            }
        } catch (err) {
            res.status(500).json(err);
        }
    },
};

module.exports = userController;
