const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

let refreshTokens = [];

const authController = {
    //REGISTER
    registerUser: async (req, res, next) => {
        try {
            const userInDB = await User.findOne({ username: req.body.username });
            if (userInDB) {
                return res.status(404).json('Tài khoản đã có người đăng ký');
            }
            const emailInDB = await User.findOne({ email: req.body.email });
            if (emailInDB) {
                return res.status(404).json('Email đã có người đăng ký');
            }

            const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT));

            const hashed = await bcrypt.hash(req.body.password, salt);

            const newUser = await new User({
                username: req.body.username,
                email: req.body.email,
                password: hashed,
            });

            const user = await newUser.save();
            const { password, ...others } = user._doc;
            return res.status(200).json(others);
        } catch (err) {
            return res.status(500).json(err);
        }
    },

    //GENERATE ACCESS TOKEN
    generateAccessToken: (user) => {
        return jwt.sign(
            {
                id: user.id,
                admin: user.admin,
            },
            process.env.JWT_ACCESS_KEY,
            { expiresIn: '30s' },
        );
    },

    //GENERATE REFRESH TOKEN
    generateRefreshToken: (user) => {
        return jwt.sign(
            {
                id: user.id,
                admin: user.admin,
            },
            process.env.JWT_REFRESH_KEY,
            { expiresIn: '30d' },
        );
    },

    //LOGIN
    loginUser: async (req, res, next) => {
        try {
            const user = await User.findOne({ username: req.body.username });
            if (!user) {
                return res.status(404).json('Tài khoản không tồn tại!');
            }

            const validPassword = await bcrypt.compare(req.body.password, user.password);
            if (!validPassword) {
                return res.status(404).json('Nhập sai mật khẩu!');
            }
            if (user && validPassword) {
                const accessToken = authController.generateAccessToken(user);

                const refreshToken = authController.generateRefreshToken(user);
                refreshTokens.push(refreshToken);

                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: false,
                    path: '/',
                    sameSite: 'strict',
                });

                const { password, ...others } = user._doc;
                return res.status(200).json({ ...others, accessToken });
            }
        } catch (err) {
            res.status(500).json(err);
        }
    },

    requestRefreshToken: async (req, res, next) => {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json('Bạn không có quyền truy cập');
        }
        if (!refreshTokens.includes(refreshToken)) {
            return res.status(403).json('Refresh token không tồn tại hoặc hết hạn!');
        }
        jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
            if (err) {
                return res.status(403).json(err);
            }

            refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
            const newAccessToken = authController.generateAccessToken(user);
            const newRefreshToken = authController.generateRefreshToken(user);
            refreshTokens.push(newRefreshToken);
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: false,
                path: '/',
                sameSite: 'strict',
            });
            res.status(200).json({ accessToken: newAccessToken });
        });
    },

    logoutUser: async (req, res, next) => {
        refreshTokens = await refreshTokens.filter((token) => token !== req.cookies.refreshToken);
        res.clearCookie('refreshToken');
        res.status(200).json('Logout!');
    },
};

module.exports = authController;
