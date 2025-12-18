/**
 * Chiroyli va esda qoladigan login/parol generatori
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

// Ismdan login yaratish
const generateUsername = (fullName, businessType) => {
  const cleanName = transliterate(fullName.trim());
  const cleanBusiness = transliterate(businessType.trim());
  
  // Ismning birinchi qismini olish
  const nameParts = cleanName.split(/\s+/);
  const firstName = nameParts[0].replace(/[^a-z]/g, '');
  
  // Biznes turidan qisqa so'z olish
  const businessWord = cleanBusiness.split(/\s+/)[0].replace(/[^a-z]/g, '').slice(0, 4);
  
  // Yil oxirgi 2 raqami
  const year = new Date().getFullYear().toString().slice(-2);
  
  // Variantlar
  const variants = [
    `${firstName}_${businessWord}`,
    `${firstName}${year}`,
    `${firstName}_${businessWord}${year}`,
    `${businessWord}_${firstName}`,
  ];
  
  // Eng qisqa va chiroyli variantni tanlash
  return variants[0].toLowerCase().slice(0, 15);
};

// Chiroyli parol yaratish (maxsus belgilarsiz)
const generatePassword = (fullName) => {
  const cleanName = transliterate(fullName.trim());
  const nameParts = cleanName.split(/\s+/);
  let firstName = nameParts[0].replace(/[^a-z]/g, '');
  
  // Agar ism bo'sh bo'lsa default qiymat
  if (!firstName || firstName.length < 2) {
    firstName = 'user';
  }
  
  // Birinchi harfni katta qilish
  const capitalName = firstName.charAt(0).toUpperCase() + firstName.slice(1, 5);
  
  // Yil
  const year = new Date().getFullYear();
  
  // Lucky raqamlar
  const lucky = Math.floor(Math.random() * 900) + 100;
  
  // Parol formatlari (maxsus belgilarsiz, faqat harf va raqam)
  const formats = [
    `${capitalName}${year}`,
    `${capitalName}${lucky}`,
    `${year}${capitalName}`,
    `${capitalName}${lucky}uz`
  ];
  
  return formats[Math.floor(Math.random() * formats.length)];
};

// Asosiy funksiya
const generateCredentials = (fullName, businessType) => {
  return {
    username: generateUsername(fullName, businessType),
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
