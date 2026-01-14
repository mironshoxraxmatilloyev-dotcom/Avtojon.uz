const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Driver = require('../models/Driver');
const Businessman = require('../models/Businessman');
const { generateTokenPair, refreshTokens, revokeAllUserTokens } = require('../utils/tokenManager');
const { protect } = require('../middleware/auth');
const { loginLimiter, registerLimiter, passwordLimiter } = require('../middleware/rateLimiter');
const { validate, authSchemas } = require('../utils/validators');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// Ismdan username yasash funksiyasi
const generateUsernameFromName = (fullName) => {
    return fullName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .substring(0, 20) || 'user';
};

// Admin register - soddalashtirilgan (faqat ism, parol, telefon)
router.post('/register', registerLimiter, asyncHandler(async (req, res) => {
    const { fullName, password, phone } = req.body;

    // Validatsiya
    if (!fullName || fullName.trim().length < 2) {
        throw new ApiError(400, 'Ismingizni kiriting (kamida 2 ta belgi)');
    }
    if (!password || password.length < 6) {
        throw new ApiError(400, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
    }

    // Ismdan username yasash
    let baseUsername = generateUsernameFromName(fullName);
    let username = baseUsername;
    let counter = 1;

    // Unique username topish
    while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
    }

    // Trial subscription - 30 kun
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 kun

    const user = await User.create({
        username,
        password,
        fullName: fullName.trim(),
        phone: phone || '',
        role: 'admin',
        subscription: {
            plan: 'trial',
            startDate: now,
            endDate: trialEndDate,
            isExpired: false
        }
    });

    const tokens = await generateTokenPair(user, 'admin');

    res.status(201).json({
        success: true,
        data: {
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: 'admin',
                subscription: user.checkSubscription()
            },
            ...tokens
        }
    });
}));

// Super Admin credentials from .env
const SUPER_ADMIN = {
    login: process.env.SUPER_ADMIN_LOGIN || 'super_admin',
    password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2024'
};

// Umumiy login (super_admin, admin, biznesmen va shofyor uchun)
router.post('/login', loginLimiter, validate(authSchemas.login), asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const cleanUsername = username.trim();

    // 1. Super Admin tekshir (.env dan)
    if (cleanUsername.toLowerCase() === SUPER_ADMIN.login.toLowerCase() && password === SUPER_ADMIN.password) {
        const tokens = await generateTokenPair({ _id: 'super_admin', username: SUPER_ADMIN.login }, 'super_admin');
        return res.json({
            success: true,
            data: {
                user: {
                    id: 'super_admin',
                    username: SUPER_ADMIN.login,
                    fullName: 'Super Admin',
                    role: 'super_admin'
                },
                ...tokens
            }
        });
    }

    // 2. Avval admin tekshir (case-insensitive)
    const user = await User.findOne({ username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } });
    if (user && await user.comparePassword(password)) {
        const tokens = await generateTokenPair(user, 'admin');
        const subscription = user.checkSubscription ? user.checkSubscription() : null;
        return res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    fullName: user.fullName,
                    companyName: user.companyName,
                    role: 'admin',
                    subscription
                },
                ...tokens
            }
        });
    }

    // Keyin biznesmen tekshir (case-insensitive)
    const businessman = await Businessman.findOne({ 
        username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') }, 
        isActive: true 
    });
    if (businessman) {
        const isMatch = await businessman.comparePassword(password);
        if (isMatch) {
            const tokens = await generateTokenPair(businessman, 'business');
            const subscription = businessman.checkSubscription();
            return res.json({
                success: true,
                data: {
                    user: {
                        id: businessman._id,
                        username: businessman.username,
                        fullName: businessman.fullName,
                        businessType: businessman.businessType,
                        role: 'business',
                        subscription
                    },
                    ...tokens
                }
            });
        }
    }

    // Keyin shofyor tekshir (case-insensitive, faqat aktiv shofyorlar)
    const driver = await Driver.findOne({ 
        username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') }, 
        isActive: true 
    });
    if (driver && await driver.comparePassword(password)) {
        const tokens = await generateTokenPair(driver, 'driver');
        return res.json({
            success: true,
            data: {
                user: {
                    id: driver._id,
                    username: driver.username,
                    fullName: driver.fullName,
                    role: 'driver',
                    userId: driver.user
                },
                ...tokens
            }
        });
    }

    throw new ApiError(401, 'Username yoki parol noto\'g\'ri');
}));

// Get current user
router.get('/me', protect, asyncHandler(async (req, res) => {
    // Driver uchun
    if (req.driver) {
        return res.json({
            success: true,
            data: req.driver
        });
    }
    
    // User (admin/fleet) uchun - subscription info qo'shish
    if (req.userRole === 'admin' && req.user?._id) {
        // Yangi so'rov bilan User ni olish (checkSubscription metodi ishlashi uchun)
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            const userData = user.toObject();
            userData.subscriptionInfo = user.checkSubscription();
            console.log('[/auth/me] Admin subscription:', userData.subscriptionInfo);
            return res.json({
                success: true,
                data: userData
            });
        }
    }
    
    // Businessman uchun
    if (req.userRole === 'business' && req.businessman?._id) {
        const businessman = await Businessman.findById(req.businessman._id).select('-password');
        if (businessman) {
            const userData = businessman.toObject();
            userData.subscriptionInfo = businessman.checkSubscription();
            console.log('[/auth/me] Business subscription:', userData.subscriptionInfo);
            console.log('[/auth/me] Business registration date:', userData.registrationDate);
            return res.json({
                success: true,
                data: userData
            });
        }
    }
    
    res.json({
        success: true,
        data: req.driver || req.user
    });
}));

// Obuna holatini olish (admin/fleet va business uchun)
router.get('/subscription', protect, asyncHandler(async (req, res) => {
    // Admin (fleet) uchun
    if (req.userRole === 'admin') {
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new ApiError(404, 'Foydalanuvchi topilmadi');
        }

        const subscription = user.checkSubscription();
        const plans = User.getPlans();

        return res.json({
            success: true,
            data: {
                ...subscription,
                plans,
                proPriceFormatted: '50 000 so\'m/oy'
            }
        });
    }

    // Business uchun
    if (req.userRole === 'business') {
        // req.businessman ishlatish kerak
        const businessmanId = req.businessman?._id || req.user?._id;
        const businessman = await Businessman.findById(businessmanId);
        if (!businessman) {
            throw new ApiError(404, 'Biznesmen topilmadi');
        }

        // checkSubscription metodi mavjudligini tekshirish
        if (typeof businessman.checkSubscription !== 'function') {
            // Agar metod yo'q bo'lsa, qo'lda hisoblash
            const now = new Date();
            const sub = businessman.subscription || {};
            const endDate = sub.endDate ? new Date(sub.endDate) : now;
            const isExpired = now > endDate;

            return res.json({
                success: true,
                data: {
                    plan: sub.plan || 'trial',
                    startDate: sub.startDate,
                    endDate: sub.endDate,
                    isExpired,
                    daysLeft: isExpired ? 0 : Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)),
                    msLeft: isExpired ? 0 : endDate - now,
                    proPriceFormatted: '50 000 so\'m/oy'
                }
            });
        }

        const subscription = businessman.checkSubscription();

        return res.json({
            success: true,
            data: {
                ...subscription,
                proPriceFormatted: '50 000 so\'m/oy'
            }
        });
    }

    throw new ApiError(400, 'Noto\'g\'ri foydalanuvchi turi');
}));

// Obunani yangilash (to'lov simulyatsiyasi - keyinchalik to'lov tizimi qo'shiladi)
router.post('/subscription/upgrade', protect, asyncHandler(async (req, res) => {
    // Admin uchun
    if (req.userRole === 'admin') {
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new ApiError(404, 'Foydalanuvchi topilmadi');
        }

        await user.upgradeToPro();
        const subscription = user.checkSubscription();

        return res.json({
            success: true,
            message: 'Pro tarifga muvaffaqiyatli o\'tdingiz!',
            data: subscription
        });
    }

    // Business uchun
    if (req.userRole === 'business') {
        const businessman = await Businessman.findById(req.user._id);
        if (!businessman) {
            throw new ApiError(404, 'Biznesmen topilmadi');
        }

        await businessman.upgradeToPro();
        const subscription = businessman.checkSubscription();

        return res.json({
            success: true,
            message: 'Pro tarifga muvaffaqiyatli o\'tdingiz!',
            data: subscription
        });
    }

    throw new ApiError(400, 'Noto\'g\'ri foydalanuvchi turi');
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ApiError(400, 'Refresh token kerak');
    }

    // Foydalanuvchini olish funksiyasi
    const getUserById = async (id, role) => {
        if (role === 'admin') {
            return User.findById(id).select('-password');
        } else if (role === 'business') {
            return Businessman.findById(id).select('-password');
        } else if (role === 'driver') {
            return Driver.findById(id).select('-password');
        }
        return null;
    };

    const tokens = await refreshTokens(refreshToken, getUserById);

    res.json({
        success: true,
        data: tokens
    });
}));

// Logout (barcha tokenlarni bekor qilish)
router.post('/logout', protect, asyncHandler(async (req, res) => {
    const userId = req.driver?._id || req.user?._id;
    const count = await revokeAllUserTokens(userId);

    res.json({
        success: true,
        message: `${count} ta token bekor qilindi`
    });
}));

// Parol o'zgartirish
router.post('/change-password', protect, passwordLimiter, validate(authSchemas.changePassword), asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    let user;
    if (req.driver) {
        user = await Driver.findById(req.driver._id);
    } else {
        user = await User.findById(req.user._id);
    }

    if (!user) {
        throw new ApiError(404, 'Foydalanuvchi topilmadi');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw new ApiError(400, 'Joriy parol noto\'g\'ri');
    }

    user.password = newPassword;
    await user.save();

    // Barcha eski tokenlarni bekor qilish
    await revokeAllUserTokens(user._id);

    // Yangi tokenlar
    const role = req.driver ? 'driver' : 'admin';
    const tokens = await generateTokenPair(user, role);

    res.json({
        success: true,
        message: 'Parol muvaffaqiyatli o\'zgartirildi',
        data: tokens
    });
}));

module.exports = router;