/**
 * Voice AI Routes - Ovozli buyruqlar
 */

const express = require('express')
const router = express.Router()
const multer = require('multer')
const { protect } = require('../middleware/auth')
const { asyncHandler, ApiError } = require('../middleware/errorHandler')
const { processVoiceCommand, isVoiceAIAvailable } = require('../services/voiceAI')
const Flight = require('../models/Flight')

// Multer - audio fayllarni qabul qilish
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Audio formatlarni qabul qilish
    const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/mp4']
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true)
    } else {
      cb(new Error('Faqat audio fayllar qabul qilinadi'), false)
    }
  },
})

/**
 * Voice AI mavjudligini tekshirish
 * GET /api/voice/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      available: isVoiceAIAvailable(),
      message: isVoiceAIAvailable()
        ? 'Voice AI tayyor'
        : 'GROQ_API_KEY sozlanmagan',
    },
  })
})

/**
 * Ovozni matnga o'girish va tahlil qilish
 * POST /api/voice/transcribe
 */
router.post(
  '/transcribe',
  protect,
  upload.single('audio'),
  asyncHandler(async (req, res) => {
    if (!isVoiceAIAvailable()) {
      throw new ApiError(503, 'Voice AI hozircha mavjud emas')
    }

    if (!req.file) {
      throw new ApiError(400, 'Audio fayl yuborilmadi')
    }

    // Debug log
    console.log('📢 Audio keldi:', {
      size: req.file.size,
      mimetype: req.file.mimetype,
      bufferLength: req.file.buffer?.length
    })

    const language = req.body.language || 'uz'
    const context = req.body.context || 'expense'

    const result = await processVoiceCommand(req.file.buffer, language, context)

    res.json({
      success: true,
      data: result,
    })
  })
)

/**
 * Ovozdan xarajat qo'shish
 * POST /api/voice/expense
 */
router.post(
  '/expense',
  protect,
  upload.single('audio'),
  asyncHandler(async (req, res) => {
    if (!isVoiceAIAvailable()) {
      throw new ApiError(503, 'Voice AI hozircha mavjud emas')
    }

    if (!req.file) {
      throw new ApiError(400, 'Audio fayl yuborilmadi')
    }

    const { flightId } = req.body
    const language = req.body.language || 'uz'

    // Ovozni tahlil qilish
    const result = await processVoiceCommand(req.file.buffer, language, 'expense')

    // Agar flightId berilgan bo'lsa, xarajatni qo'shish
    if (flightId && result.data?.amount) {
      const flight = await Flight.findOne({
        _id: flightId,
        user: req.user._id,
      })

      if (!flight) {
        throw new ApiError(404, 'Reys topilmadi')
      }

      // Xarajat qo'shish
      const expense = {
        type: result.data.type || 'other',
        amount: result.data.amount,
        description: result.data.description || result.text,
        addedBy: 'voice',
        createdAt: new Date(),
      }

      flight.expenses.push(expense)
      flight.totalExpenses = flight.expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
      await flight.save()

      return res.json({
        success: true,
        data: {
          text: result.text,
          parsed: result.data,
          expense,
          flight: {
            _id: flight._id,
            totalExpenses: flight.totalExpenses,
          },
        },
        message: 'Xarajat qo\'shildi',
      })
    }

    // Faqat tahlil natijasini qaytarish
    res.json({
      success: true,
      data: result,
    })
  })
)

module.exports = router
