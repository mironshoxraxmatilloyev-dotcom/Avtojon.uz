/**
 * Oddiy va esda qoladigan login/parol generatori
 */

// O'zbek ismlari uchun transliteratsiya
const transliterate = (text) => {
  const map = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': '',
    'ы': 'i', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ў': 'o', 'қ': 'q',
    'ғ': 'g', 'ҳ': 'h', "'": '', 'ʼ': ''
  };

  return text.toLowerCase().split('').map(char => map[char] || char).join('');
};

// Ismdan login yaratish - ODDIY
const generateUsername = (fullName) => {
  const cleanName = transliterate(fullName.trim());
  const nameParts = cleanName.split(/\s+/).filter(p => p.length > 0);

  // Faqat birinchi ism
  const firstName = nameParts[0]?.replace(/[^a-z]/g, '') || 'user';

  return firstName.toLowerCase().slice(0, 15);
};

// Oddiy parol yaratish - ism123
const generatePassword = (fullName) => {
  const cleanName = transliterate(fullName.trim());
  const nameParts = cleanName.split(/\s+/).filter(p => p.length > 0);
  const firstName = nameParts[0]?.replace(/[^a-z]/g, '') || 'user';

  // Parol formati: ism123 (masalan: javohir123)
  return `${firstName.toLowerCase()}123`;
};

// Asosiy funksiya
const generateCredentials = (fullName, businessType, phone = '') => {
  return {
    username: generateUsername(fullName),
    password: generatePassword(fullName)
  };
};

// Username mavjudligini tekshirish uchun unique qilish
const makeUsernameUnique = async (baseUsername, checkExists) => {
  let username = baseUsername;
  let counter = 1;

  while (await checkExists(username)) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
};

module.exports = {
  generateCredentials,
  generateUsername,
  generatePassword,
  makeUsernameUnique,
  transliterate
};
