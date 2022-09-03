const authController = require('../controllers/authController');
const middlewareController = require('../controllers/middlewareController');

const router = require('express').Router();

router.post('/register', authController.registerUser);
router.get('/register', (req, res) => {
    return res.status(404).json('Vao thanh cong');
})

router.post('/login', authController.loginUser);

router.post('/refresh', authController.requestRefreshToken);

router.post('/logout', middlewareController.verifyToken, authController.logoutUser);

module.exports = router;
