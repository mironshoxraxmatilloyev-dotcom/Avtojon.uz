/**
 * Oddiy va esda qoladigan login/parol generatori
 * Lotin alifbosida yaratadi, lekin kirill ham qabul qilinadi
 */

// Kirill -> Lotin transliteratsiya (database uchun)
const transliterate = (text) => {
  const map = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'j',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'x',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'sh',
    ъ: '',
    ы: 'i',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
    ў: 'o',
    қ: 'q',
    ғ: 'g',
    ҳ: 'h',
    "'": '',
    ʼ: '',
  }

  return text
    .toLowerCase()
    .split('')
    .map((char) => map[char] || char)
    .join('')
}

// Ismdan birinchi ismni olish
const getFirstName = (fullName) => {
  const name = fullName.trim()
  const nameParts = name.split(/\s+/).filter((p) => p.length > 0)
  return nameParts[0] || 'user'
}

// 1-harfni katta qilish
const capitalize = (str) => {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Ismdan login yaratish - LOTIN alifbosida, 1-harf katta
// Masalan: "Alisher Valiyev" -> "Alisher"
// Masalan: "Алишер Валиев" -> "Alisher"
const generateUsername = (fullName) => {
  const firstName = getFirstName(fullName)

  // Kirill bo'lsa lotin ga o'tkazish
  const latinName = transliterate(firstName).replace(/[^a-z]/g, '')

  // 1-harfni katta qilish
  return capitalize(latinName.slice(0, 15)) || 'User'
}

// Oddiy parol yaratish - Ism123 (1-harf katta)
// Masalan: "Alisher" -> "Alisher123"
const generatePassword = (fullName) => {
  const username = generateUsername(fullName)
  return `${username}123`
}

// Asosiy funksiya
const generateCredentials = (fullName, businessType, phone = '') => {
  return {
    username: generateUsername(fullName),
    password: generatePassword(fullName),
  }
}

// Username mavjudligini tekshirish uchun unique qilish
const makeUsernameUnique = async (baseUsername, checkExists) => {
  let username = baseUsername
  let counter = 1

  while (await checkExists(username)) {
    username = `${baseUsername}${counter}`
    counter++
  }

  return username
}

module.exports = {
  generateCredentials,
  generateUsername,
  generatePassword,
  makeUsernameUnique,
  transliterate,
}
