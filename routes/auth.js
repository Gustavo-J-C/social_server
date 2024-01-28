const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth');

router.post('/login', authController.login);

router.post('/register', authController.register)

router.post('/reset-password', authController.resetPassword)

router.post('/refresh-token', authController.refreshToken)

router.post(
    "/verify-token",
    async (req, res, next) => {
        const token = req.body.token;
        if (!token) {
            res.status(400).json("Missing required paramaters");
        } else {
            try {
                const isTokenValid = await veryResetToken(token);
                if (!isTokenValid) {
                    res.status(400).json("Invalid token");
                } else {
                    const existingUser = await User.findOne({ email: isTokenValid });
                    if (existingUser.resetToken !== token) {
                        res.status(400).json("Invalid token");
                    } else {
                        res.status(200).json("Token is valid");
                    }
                }
            } catch (error) {
                res.status(500).json("Internal server error");
            }
        }
    }
);

module.exports = router;