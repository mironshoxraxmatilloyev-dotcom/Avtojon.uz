/**
 * Voice AI Service - Groq Whisper + LLM
 * Ovozni matnga o'girish va ma'lumotni tahlil qilish
 */

const Groq = require('groq-sdk')
const { Readable } = require('stream')

// Groq client
let groqClient = null

const getGroqClient = () => {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqClient
}

/**
 * Ovozni matnga o'girish (Whisper) - retry bilan
 * @param {Buffer} audioBuffer - Audio fayl buffer
 * @param {string} language - Til kodi (uz, ru, en)
 * @param {number} retries - Qayta urinishlar soni
 * @returns {Promise<string>} - Matn
 */
const transcribeAudio = async (audioBuffer, language = 'uz', retries = 2) => {
  const groq = getGroqClient()
  if (!groq) {
    throw new Error('GROQ_API_KEY sozlanmagan')
  }

  let lastError = null
  
  // O'zbek tili uchun prompt - Whisper'ga kontekst berish
  const languagePrompts = {
    uz: "Bu o'zbek tilida yozilgan audio. Yuk tashish, mashina, haydovchi, benzin, ta'mirlash, pul, summa haqida gap ketmoqda.",
    ru: "Это аудио на русском языке о грузоперевозках, машинах, водителях, бензине, ремонте, деньгах.",
    en: "This is about trucking, vehicles, drivers, fuel, maintenance, and payments."
  }
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Buffer ni File ga o'tkazish
      const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' })

      console.log('🎤 Whisper ga yuborilmoqda:', {
        fileSize: audioBuffer.length,
        language: language
      })

      // O'zbek tili uchun language parametri bilan
      const transcription = await groq.audio.transcriptions.create({
        file: file,
        model: 'whisper-large-v3',
        language: 'uz',
        response_format: 'text',
      })

      console.log('✅ Whisper javobi:', transcription)

      return transcription.trim()
    } catch (error) {
      lastError = error
      console.error(`Whisper xatosi (urinish ${attempt + 1}/${retries + 1}):`, error.message)
      
      // Agar connection error bo'lsa va urinishlar qolgan bo'lsa, qayta urinish
      if (attempt < retries && (error.code === 'ECONNRESET' || error.message?.includes('Connection'))) {
        console.log(`⏳ ${attempt + 1} sekund kutib qayta urinilmoqda...`)
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000))
        continue
      }
      break
    }
  }
  
  throw new Error('Ovozni tanib bo\'lmadi: ' + (lastError?.message || 'Noma\'lum xato'))
}

/**
 * Matnni tahlil qilish va strukturalangan ma'lumot olish
 * @param {string} text - Foydalanuvchi aytgan matn
 * @param {string} context - Kontekst (flight, expense, vehicle, etc.)
 * @returns {Promise<object>} - Strukturalangan ma'lumot
 */
const parseVoiceCommand = async (text, context = 'expense') => {
  const groq = getGroqClient()
  if (!groq) {
    throw new Error('GROQ_API_KEY sozlanmagan')
  }

  const systemPrompt = `Sen O'zbekistondagi yuk tashish kompaniyasi uchun ovozli buyruqlarni tahlil qiluvchi mutaxassis AI san.
Foydalanuvchi O'ZBEK yoki RUS tilida gapiradi. Vazifang - aytilgan gapdan ANIQ ma'lumotlarni ajratib, JSON formatida qaytarish.

## MUHIM QOIDALAR:

### 1. SUMMA ANIQLASH (amount):
O'zbek tilida raqamlar:
- "bir" = 1, "ikki" = 2, "uch" = 3, "to'rt" = 4, "besh" = 5
- "olti" = 6, "yetti" = 7, "sakkiz" = 8, "to'qqiz" = 9, "o'n" = 10
- "yigirma" = 20, "o'ttiz" = 30, "qirq" = 40, "ellik" = 50
- "oltmish" = 60, "yetmish" = 70, "sakson" = 80, "to'qson" = 90
- "yuz" = 100, "ming" = 1000, "million" = 1000000

Summa hisoblash misollari:
- "ikki yuz ellik ming" = 250000
- "250 ming" = 250000
- "bir million" = 1000000
- "1.5 million" = 1500000
- "uch yuz ming" = 300000
- "50 mingta" = 50000
- "yuz ming so'm" = 100000
- "besh yuz" = 500 (ming aytilmasa, ming deb hisobla = 500000)
- "o'n besh ming" = 15000
- "yigirma besh" = 25000 (ming deb hisobla)

Rus tilida:
- "двести пятьдесят тысяч" = 250000
- "сто тысяч" = 100000
- "полтора миллиона" = 1500000

### 2. XARAJAT TURI (type):
YOQILG'I (fuel):
- metan, метан, gaz, газ = fuel (default: metan)
- benzin, бензин, 80, 91, 92, 95 = fuel
- dizel, diesel, дизель, solyarka, солярка = fuel
- propan, пропан = fuel
- yoqilg'i, топливо, zapravka, заправка = fuel

OVQAT (food):
- ovqat, еда, tushlik, обед, nonushta, завтрак, kechki ovqat, ужин
- choy, чай, kofe, кофе, tamaddi, перекус

TA'MIR (repair):
- ta'mir, ремонт, remont, tuzatish, починка
- shina, шина, g'ildirak, колесо, balon, балон
- moy, масло, filtr, фильтр, tormoz, тормоз

YO'L TO'LOVI (toll):
- yo'l to'lovi, дорожный сбор, post, пост, КПП
- platon, платон, штраф за дорогу

YUVISH (wash):
- yuvish, мойка, moyka, mashina yuvish, помыл машину

JARIMA (fine):
- jarima, штраф, GAI, ГАИ, YPX, tezlik

PARKOVKA (parking):
- parkovka, парковка, turish, стоянка

BOSHQA (other):
- boshqa xarajat, прочее, qo'shimcha

### 3. MARSHRUT (route):
Shaharlar: Toshkent, Samarqand, Buxoro, Xiva, Urganch, Nukus, Qarshi, Termiz, Andijon, Farg'ona, Namangan, Jizzax, Navoiy, Guliston, Qo'qon, Marg'ilon, Chirchiq, Olmaliq, Angren, Bekobod, Denov, Shahrisabz, Kitob, G'ijduvon, Kogon, Xonqa, Pitnak, Beruniy, Chimboy, Mo'ynoq, Zarafshon, Uchquduq, Gazli, Nurota, Kattaqo'rg'on, Ishtixon, Payariq, Urgut, Jomboy, Oqtosh, Pop, Chust, Kosonsoy, Rishton, Quva, Oltiariq, Asaka, Xo'jaobod, Shahrixon, Baliqchi, Paxtaobod, Xonobod, Qorasuv

Agar "dan" yoki "ga" ishlatilsa:
- "Toshkentdan Buxoroga" = fromCity: "Toshkent", toCity: "Buxoro"
- "Samarqand-Toshkent" = fromCity: "Samarqand", toCity: "Toshkent"

### 4. YOQILG'I MIQDORI (quantity) va BIRLIGI (quantityUnit):
MUHIM QOIDA - YOQILG'I TURIGA QARAB BIRLIK AVTOMATIK ANIQLANADI:
- METAN va PROPAN = FAQAT "kub" (kubometr)
- BENZIN va DIZEL = FAQAT "litr"

Agar foydalanuvchi "litr" desa lekin metan/propan bo'lsa - "kub" ga o'zgartir!
Agar foydalanuvchi "kub" desa lekin benzin/dizel bo'lsa - "litr" ga o'zgartir!

Misollar:
- "10 kub metan" = quantity: 10, quantityUnit: "kub", fuelType: "metan" ✓
- "10 litr metan" = quantity: 10, quantityUnit: "kub", fuelType: "metan" (litr emas, kub!)
- "50 litr dizel" = quantity: 50, quantityUnit: "litr", fuelType: "dizel" ✓
- "50 kub dizel" = quantity: 50, quantityUnit: "litr", fuelType: "dizel" (kub emas, litr!)
- "o'n kubi" = quantity: 10, quantityUnit: "kub" (default metan)
- "ellik litr benzin" = quantity: 50, quantityUnit: "litr", fuelType: "benzin" ✓
- "yigirma besh kub propan" = quantity: 25, quantityUnit: "kub", fuelType: "propan" ✓

### 5. SPIDOMETR/ODOMETR (odometer):
MUHIM: Spidometr odatda katta raqam (10000+) va "km", "spidometr", "spidameter", "odometr" so'zlari bilan keladi!
- "spidometr 14420" = odometer: 14420
- "spidameter 14420" = odometer: 14420
- "14420 km" = odometer: 14420
- "odometr 150000" = odometer: 150000
- "kilometr 14420" = odometer: 14420

### 6. VAQT (date):
- "bugun" = bugungi sana
- "kecha" = kechagi sana
- "ertaga" = ertangi sana

## JAVOB FORMATI:
{
  "type": "fuel|food|repair|toll|wash|fine|parking|other",
  "amount": 250000,
  "description": "Qisqa tavsif",
  "fuelType": "metan|benzin|dizel|propan|null",
  "quantity": 10,
  "quantityUnit": "litr|kub|null",
  "odometer": 14420,
  "route": {
    "fromCity": "Toshkent",
    "toCity": "Buxoro"
  },
  "confidence": 0.95
}

## MISOLLAR:

Kirish: "100 ming so'mga o'n kub metan oldim spidometr 14420"
Chiqish: {"type":"fuel","amount":100000,"fuelType":"metan","quantity":10,"quantityUnit":"kub","odometer":14420,"description":"Metan olindi","confidence":0.95}

Kirish: "Ikki yuz ellik mingga 50 litr dizel oldim"
Chiqish: {"type":"fuel","amount":250000,"fuelType":"dizel","quantity":50,"quantityUnit":"litr","description":"Dizel olindi","confidence":0.95}

Kirish: "yuz mingga on litr metan olindi"
Chiqish: {"type":"fuel","amount":100000,"fuelType":"metan","quantity":10,"quantityUnit":"kub","description":"Metan olindi","confidence":0.95}

Kirish: "100 mingga 10 litr metan"
Chiqish: {"type":"fuel","amount":100000,"fuelType":"metan","quantity":10,"quantityUnit":"kub","description":"Metan olindi","confidence":0.95}

Kirish: "ellik litr benzinga ikki yuz ming"
Chiqish: {"type":"fuel","amount":200000,"fuelType":"benzin","quantity":50,"quantityUnit":"litr","description":"Benzin olindi","confidence":0.95}

Kirish: "Toshkent Buxoro yo'lida uch yuz mingga yoqilg'i"
Chiqish: {"type":"fuel","amount":300000,"description":"Toshkent-Buxoro yo'lida yoqilg'i","fuelType":"metan","quantityUnit":"kub","route":{"fromCity":"Toshkent","toCity":"Buxoro"},"confidence":0.9}

Kirish: "Tushlikka ellik ming sarfladim"
Chiqish: {"type":"food","amount":50000,"description":"Tushlik","confidence":0.95}

Kirish: "Mashina yuvishga o'ttiz ming"
Chiqish: {"type":"wash","amount":30000,"description":"Mashina yuvish","confidence":0.95}

Kirish: "Yo'l to'lovi yigirma ming"
Chiqish: {"type":"toll","amount":20000,"description":"Yo'l to'lovi","confidence":0.95}

Kirish: "G'ildirak ta'miriga yuz ming ketdi"
Chiqish: {"type":"repair","amount":100000,"description":"G'ildirak ta'miri","confidence":0.9}

FAQAT JSON QAYTAR, BOSHQA HECH NARSA YO'Q!`

  // Reys ochish uchun alohida prompt
  const flightPrompt = `Sen O'zbekistondagi yuk tashish kompaniyasi uchun ovozli buyruqlarni tahlil qiluvchi AI san.
Foydalanuvchi REYS OCHISH uchun gapirmoqda. Uning aytganidan quyidagi ma'lumotlarni ajrat:

## ANIQLASH KERAK:
1. driverName - Haydovchi ismi
2. route.fromCity - Qayerdan (shahar nomi)
3. route.toCity - Qayerga (shahar nomi)
4. givenBudget - Yo'l puli (so'mda)
5. payment - Mijozdan olinadigan to'lov (so'mda)
6. startOdometer - Spidometr ko'rsatkichi (km)
7. startFuel - Yoqilg'i miqdori (litr/kub)
8. fuelType - Yoqilg'i turi (metan, propan, benzin, diesel)
9. flightType - Mashrut turi (domestic=mahalliy, international=xalqaro)

## HAYDOVCHI ISMLARI:
Anvar, Bekzod, Sardor, Jamshid, Rustam, Sherzod, Dilshod, Akmal, Botir, Nodir, Ulug'bek, Farhod, Jasur, Sanjar, Alisher, Bobur, Davron, Eldor, Farrux, Gayrat, Hamid, Ilhom, Jahongir, Karim, Laziz, Mansur, Nazar, Odil, Pulat, Qodir, Ravshan, Saidakbar, Tohir, Umid, Vali, Xurshid, Yusuf, Zafar, Abdulla, Aziz, Baxtiyor, Doniyor, Elbek, Furqat, Gulom, Husan, Islom, Javlon, Komil, Lochin, Mirzo, Nurali, Oybek, Parviz, Quvondiq, Rauf, Sobir, Temur, Umar, Vohid, Xasan, Yoqub, Zayniddin

## SHAHARLAR (O'zbekiston):
Toshkent, Samarqand, Buxoro, Xiva, Urganch, Nukus, Qarshi, Termiz, Andijon, Farg'ona, Namangan, Jizzax, Navoiy, Guliston, Qo'qon, Marg'ilon, Chirchiq, Olmaliq, Angren, Bekobod, Denov, Shahrisabz, Kitob, G'ijduvon, Kogon, Xonqa, Pitnak, Beruniy, Chimboy, Mo'ynoq, Zarafshon, Uchquduq, Gazli, Nurota, Kattaqo'rg'on, Ishtixon, Payariq, Urgut, Jomboy, Oqtosh, Pop, Chust, Kosonsoy, Rishton, Quva, Oltiariq, Asaka, Xo'jaobod, Shahrixon, Baliqchi, Paxtaobod, Xonobod, Qorasuv

## XALQARO SHAHARLAR:
Rossiya: Moskva, Sankt-Peterburg, Kazan, Novosibirsk, Yekaterinburg
Qozog'iston: Olmaota, Nur-Sultan, Shimkent, Turkiston
Qirg'iziston: Bishkek, Osh

## SUMMA HISOBLASH:
O'zbek tilida:
- "bir" = 1, "ikki" = 2, "uch" = 3, "to'rt" = 4, "besh" = 5
- "olti" = 6, "yetti" = 7, "sakkiz" = 8, "to'qqiz" = 9, "o'n" = 10
- "yigirma" = 20, "o'ttiz" = 30, "qirq" = 40, "ellik" = 50
- "oltmish" = 60, "yetmish" = 70, "sakson" = 80, "to'qson" = 90
- "yuz" = 100, "ming" = 1000, "million" = 1000000

Misollar:
- "besh yuz ming" = 500000
- "500 ming" = 500000
- "bir million" = 1000000
- "1.5 million" = 1500000
- "ikki yuz ellik ming" = 250000
- "uch million" = 3000000

## YOQILG'I TURLARI:
- metan, gaz, метан = "metan"
- propan, пропан = "propan"
- benzin, бензин, 80, 91, 92, 95 = "benzin"
- dizel, diesel, дизель, solyarka = "diesel"

## MASHRUT TURI:
- Agar shahar O'zbekiston ichida bo'lsa = "domestic"
- Agar shahar Rossiya, Qozog'iston, Qirg'iziston bo'lsa = "international"

## MISOLLAR:

Kirish: "Anvar Toshkentdan Buxoroga"
Chiqish: {"driverName":"Anvar","route":{"fromCity":"Toshkent","toCity":"Buxoro"},"flightType":"domestic","confidence":0.95}

Kirish: "Bekzod Samarqandga besh yuz ming yo'l puli bilan"
Chiqish: {"driverName":"Bekzod","route":{"toCity":"Samarqand"},"givenBudget":500000,"flightType":"domestic","confidence":0.9}

Kirish: "Sardor Navoiydan Toshkentga bir million spidometr 145000"
Chiqish: {"driverName":"Sardor","route":{"fromCity":"Navoiy","toCity":"Toshkent"},"givenBudget":1000000,"startOdometer":145000,"flightType":"domestic","confidence":0.95}

Kirish: "Jamshid Farg'onaga ketsin 700 ming yo'l puli 2 million to'lov"
Chiqish: {"driverName":"Jamshid","route":{"toCity":"Farg'ona"},"givenBudget":700000,"payment":2000000,"flightType":"domestic","confidence":0.9}

Kirish: "Akmal Toshkentdan Moskvaga xalqaro reys 3 million"
Chiqish: {"driverName":"Akmal","route":{"fromCity":"Toshkent","toCity":"Moskva"},"givenBudget":3000000,"flightType":"international","confidence":0.95}

Kirish: "Botir Buxorodan Olmaotaga 50 litr benzin bilan"
Chiqish: {"driverName":"Botir","route":{"fromCity":"Buxoro","toCity":"Olmaota"},"startFuel":50,"fuelType":"benzin","flightType":"international","confidence":0.9}

Kirish: "Rustam Andijondan Qo'qonga metan bilan ketsin"
Chiqish: {"driverName":"Rustam","route":{"fromCity":"Andijon","toCity":"Qo'qon"},"fuelType":"metan","flightType":"domestic","confidence":0.9}

FAQAT JSON QAYTAR!`

  // Moy almashtirish uchun prompt
  const oilPrompt = `Sen O'zbekistondagi yuk tashish kompaniyasi uchun ovozli buyruqlarni tahlil qiluvchi AI san.
Foydalanuvchi MOY ALMASHTIRISH haqida gapirmoqda. Uning aytganidan quyidagi ma'lumotlarni ajrat:

## ANIQLASH KERAK:
1. oilType - Moy turi (5W-30, 10W-40, 15W-40, 20W-50, sintetik, yarim sintetik, mineral)
2. oilBrand - Moy brendi (Mobil, Shell, Castrol, Total, Lukoil, G-Energy, ZIC, Mannol)
3. liters - Moy miqdori (litr)
4. cost - Narxi (so'mda)
5. odometer - Spidometr ko'rsatkichi (km)
6. nextChangeOdometer - Keyingi almashtirish km

## SUMMA HISOBLASH:
O'zbek tilida:
- "bir" = 1, "ikki" = 2, "uch" = 3, "to'rt" = 4, "besh" = 5
- "olti" = 6, "yetti" = 7, "sakkiz" = 8, "to'qqiz" = 9, "o'n" = 10
- "yigirma" = 20, "o'ttiz" = 30, "qirq" = 40, "ellik" = 50
- "oltmish" = 60, "yetmish" = 70, "sakson" = 80, "to'qson" = 90
- "yuz" = 100, "ming" = 1000, "million" = 1000000

## MISOLLAR:

Kirish: "8 litr Mobil 10W-40 moyga 400 ming so'm"
Chiqish: {"oilType":"10W-40","oilBrand":"Mobil","liters":8,"cost":400000,"confidence":0.95}

Kirish: "Shell sintetik moy 500 mingga spidometr 145000"
Chiqish: {"oilType":"sintetik","oilBrand":"Shell","cost":500000,"odometer":145000,"confidence":0.9}

Kirish: "10 litr moyga 300 ming ketdi"
Chiqish: {"liters":10,"cost":300000,"confidence":0.85}

Kirish: "Castrol 5W-30 6 litr 450 ming keyingi almashtirish 160000 da"
Chiqish: {"oilType":"5W-30","oilBrand":"Castrol","liters":6,"cost":450000,"nextChangeOdometer":160000,"confidence":0.95}

Kirish: "Moy almashtirishga 350 ming sarfladim"
Chiqish: {"cost":350000,"confidence":0.8}

FAQAT JSON QAYTAR!`

  // Shina qo'shish uchun prompt
  const tirePrompt = `Sen O'zbekistondagi yuk tashish kompaniyasi uchun ovozli buyruqlarni tahlil qiluvchi AI san.
Foydalanuvchi SHINA haqida gapirmoqda. Uning aytganidan quyidagi ma'lumotlarni ajrat:

## ANIQLASH KERAK:
1. brand - Shina brendi (Michelin, Bridgestone, Continental, Goodyear, Pirelli, Yokohama, Hankook, Kumho, Triangle, Aeolus, Doublestar)
2. size - O'lcham (315/80R22.5, 295/80R22.5, 385/65R22.5, 12.00R20, 11.00R20)
3. position - Pozitsiya (Old chap, Old o'ng, Orqa chap, Orqa o'ng, Orqa chap ichki, Orqa o'ng ichki)
4. cost - Narxi (so'mda)
5. count - Soni (agar bir nechta bo'lsa)
6. installOdometer - O'rnatilgan km
7. expectedLifeKm - Kutilgan umr (km)

## POZITSIYALAR:
- old, oldi, old g'ildirak = Old
- orqa, orqasi, orqa g'ildirak = Orqa
- chap = chap
- o'ng = o'ng
- ichki = ichki

## SUMMA HISOBLASH:
- "bir million" = 1000000
- "ikki million" = 2000000
- "bir yarim million" = 1500000
- "800 ming" = 800000

## MISOLLAR:

Kirish: "Michelin 315/80 shina old chapga 1.5 million"
Chiqish: {"brand":"Michelin","size":"315/80R22.5","position":"Old chap","cost":1500000,"confidence":0.95}

Kirish: "4 ta Triangle shina 6 millionga"
Chiqish: {"brand":"Triangle","count":4,"cost":6000000,"confidence":0.9}

Kirish: "Orqa o'ng shinani almashtirishga 800 ming ketdi Bridgestone"
Chiqish: {"brand":"Bridgestone","position":"Orqa o'ng","cost":800000,"confidence":0.9}

Kirish: "2 ta old shina Hankook 2 million"
Chiqish: {"brand":"Hankook","count":2,"cost":2000000,"confidence":0.85}

Kirish: "Shina almashtirishga 5 million sarfladim"
Chiqish: {"cost":5000000,"confidence":0.75}

FAQAT JSON QAYTAR!`

  // Xizmat (service) uchun prompt
  const servicePrompt = `Sen O'zbekistondagi yuk tashish kompaniyasi uchun ovozli buyruqlarni tahlil qiluvchi AI san.
Foydalanuvchi TEXNIK XIZMAT haqida gapirmoqda. Uning aytganidan quyidagi ma'lumotlarni ajrat:

## ANIQLASH KERAK:
1. type - Xizmat turi (TO-1, TO-2, TO-3, Tormoz, Mufta, Reduktor, Dvigatel, Korobka, Elektrika, Kuzov, Boshqa)
2. cost - Narxi (so'mda)
3. odometer - Spidometr ko'rsatkichi (km)
4. description - Tavsif
5. serviceName - Xizmat ko'rsatuvchi nomi

## XIZMAT TURLARI:
- TO, texnik ko'rik, TO-1, TO-2, TO-3 = TO-1/TO-2/TO-3
- tormoz, tormoz kolodkasi, tormoz diski = Tormoz
- mufta, stsepleniye, debriyaj = Mufta
- reduktor, most, differensial = Reduktor
- dvigatel, motor = Dvigatel
- korobka, KPP = Korobka
- elektrika, generator, starter = Elektrika
- kuzov, kabina = Kuzov

## SUMMA HISOBLASH:
- "bir million" = 1000000
- "500 ming" = 500000
- "2 million" = 2000000

## MISOLLAR:

Kirish: "TO-2 ga 800 ming ketdi spidometr 150000"
Chiqish: {"type":"TO-2","cost":800000,"odometer":150000,"confidence":0.95}

Kirish: "Tormoz kolodkalarini almashtirishga 400 ming"
Chiqish: {"type":"Tormoz","cost":400000,"description":"Tormoz kolodkalari almashtirish","confidence":0.9}

Kirish: "Dvigatel ta'miriga 3 million sarfladim Avtoservisda"
Chiqish: {"type":"Dvigatel","cost":3000000,"serviceName":"Avtoservis","confidence":0.9}

Kirish: "Mufta almashtirishga 1.5 million"
Chiqish: {"type":"Mufta","cost":1500000,"confidence":0.9}

Kirish: "Texnik xizmatga 500 ming ketdi"
Chiqish: {"type":"TO-1","cost":500000,"confidence":0.8}

FAQAT JSON QAYTAR!`

  // Daromad qo'shish uchun prompt
  const incomePrompt = `Sen O'zbekistondagi yuk tashish kompaniyasi uchun ovozli buyruqlarni tahlil qiluvchi AI san.
Foydalanuvchi MASHINA DAROMADI haqida gapirmoqda. Uning aytganidan quyidagi ma'lumotlarni ajrat:

## ANIQLASH KERAK:
1. type - Daromad turi (trip=marshrut, rental=ijara, contract=shartnoma, other=boshqa)
2. amount - Summa (so'mda)
3. fromCity - Qayerdan (shahar)
4. toCity - Qayerga (shahar)
5. distance - Masofa (km)
6. cargoWeight - Yuk og'irligi (tonna)
7. clientName - Mijoz nomi
8. rentalDays - Ijara kunlari (faqat ijara uchun)
9. rentalRate - Kunlik narx (faqat ijara uchun)
10. description - Izoh

## DAROMAD TURLARI:
- marshrut, reys, yuk tashish, yuk olib ketish = "trip"
- ijara, ijaraga berish, ijaraga oldim = "rental"
- shartnoma, kontrakt, doimiy = "contract"
- boshqa = "other"

## SHAHARLAR:
Toshkent, Samarqand, Buxoro, Xiva, Urganch, Nukus, Qarshi, Termiz, Andijon, Farg'ona, Namangan, Jizzax, Navoiy, Guliston, Qo'qon, Marg'ilon, Chirchiq, Olmaliq, Angren, Bekobod, Denov, Shahrisabz

## SUMMA HISOBLASH:
- "bir million" = 1000000
- "5 million" = 5000000
- "ikki yarim million" = 2500000
- "800 ming" = 800000
- "besh yuz ming" = 500000

## MISOLLAR:

Kirish: "Toshkentdan Samarqandga yuk tashib 5 million oldim"
Chiqish: {"type":"trip","amount":5000000,"fromCity":"Toshkent","toCity":"Samarqand","confidence":0.95}

Kirish: "Buxoroga 20 tonna yuk olib ketdim 3 million"
Chiqish: {"type":"trip","amount":3000000,"toCity":"Buxoro","cargoWeight":20,"confidence":0.9}

Kirish: "Mashinani 7 kunga ijaraga berdim kuniga 500 ming"
Chiqish: {"type":"rental","rentalDays":7,"rentalRate":500000,"amount":3500000,"confidence":0.95}

Kirish: "Ahmedov kompaniyasiga yuk tashib 2 million oldim"
Chiqish: {"type":"trip","amount":2000000,"clientName":"Ahmedov","confidence":0.9}

Kirish: "Farg'onadan Toshkentga 300 km yuk tashidim 4 million"
Chiqish: {"type":"trip","amount":4000000,"fromCity":"Farg'ona","toCity":"Toshkent","distance":300,"confidence":0.95}

Kirish: "Shartnoma bo'yicha 10 million daromad"
Chiqish: {"type":"contract","amount":10000000,"confidence":0.9}

Kirish: "Boshqa daromad 500 ming"
Chiqish: {"type":"other","amount":500000,"confidence":0.85}

FAQAT JSON QAYTAR!`

  // Mashina qo'shish uchun prompt
  const vehiclePrompt = `Sen O'zbekistondagi yuk tashish kompaniyasi uchun ovozli buyruqlarni tahlil qiluvchi AI san.
Foydalanuvchi MASHINA QO'SHISH uchun gapirmoqda. Uning aytganidan quyidagi ma'lumotlarni ajrat:

## ANIQLASH KERAK:
1. plateNumber - Davlat raqami (01A123BC formatida)
2. brand - Mashina markasi
3. year - Ishlab chiqarilgan yil
4. fuelType - Yoqilg'i turi (diesel, petrol, gas, metan)
5. fuelTankCapacity - Bak hajmi (litr yoki kub)
6. currentOdometer - Spidometr ko'rsatkichi (km)

## MASHINA MARKALARI:
MAN, Volvo, Mercedes, Scania, DAF, Iveco, Renault, Kamaz, MAZ, Howo, Shacman, FAW, Dongfeng, Isuzu, Hino, Mitsubishi, Hyundai, Daewoo, Chevrolet, Ford, Volkswagen

## DAVLAT RAQAMI FORMATLARI:
- "01 A 123 BC" = "01A123BC"
- "bir A yuz yigirma uch BC" = "01A123BC"
- "nol bir A bir ikki uch BC" = "01A123BC"

## YOQILG'I TURLARI:
- dizel, diesel, дизель, solyarka = "diesel"
- benzin, бензин, petrol = "petrol"
- gaz, газ, propan = "gas"
- metan, метан = "metan"

## MISOLLAR:

Kirish: "MAN 2020 yil dizel 01A123BC"
Chiqish: {"brand":"MAN","year":2020,"fuelType":"diesel","plateNumber":"01A123BC","confidence":0.95}

Kirish: "Volvo mashina benzin bilan 50A777AA"
Chiqish: {"brand":"Volvo","fuelType":"petrol","plateNumber":"50A777AA","confidence":0.9}

Kirish: "Kamaz 2018 yil metan spidometr 250000"
Chiqish: {"brand":"Kamaz","year":2018,"fuelType":"metan","currentOdometer":250000,"confidence":0.9}

Kirish: "Mercedes Actros 2021 dizel bak 400 litr"
Chiqish: {"brand":"Mercedes Actros","year":2021,"fuelType":"diesel","fuelTankCapacity":400,"confidence":0.95}

Kirish: "Howo 2019 metan 01B456CD"
Chiqish: {"brand":"Howo","year":2019,"fuelType":"metan","plateNumber":"01B456CD","confidence":0.95}

FAQAT JSON QAYTAR!`

  // Kontekstga qarab prompt tanlash
  let finalPrompt = systemPrompt
  if (context === 'flight') finalPrompt = flightPrompt
  else if (context === 'vehicle') finalPrompt = vehiclePrompt
  else if (context === 'oil') finalPrompt = oilPrompt
  else if (context === 'tire') finalPrompt = tirePrompt
  else if (context === 'service') finalPrompt = servicePrompt
  else if (context === 'income') finalPrompt = incomePrompt

  const userPrompt = `Foydalanuvchi aytdi: "${text}"

JSON:`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: finalPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.05, // Juda past - aniqroq javob uchun
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('LLM javob bermadi')
    }

    const parsed = JSON.parse(response)
    
    // Agar amount string bo'lsa, raqamga aylantirish
    if (typeof parsed.amount === 'string') {
      parsed.amount = parseInt(parsed.amount.replace(/\D/g, ''), 10) || 0
    }
    
    // Agar amount juda kichik bo'lsa (1000 dan kam), ming deb hisobla
    if (parsed.amount > 0 && parsed.amount < 1000) {
      parsed.amount = parsed.amount * 1000
    }
    
    // MUHIM: Yoqilg'i turiga qarab birlikni to'g'rilash
    // Metan va Propan = kub (kubometr)
    // Benzin va Dizel = litr
    if (parsed.fuelType) {
      const gasTypes = ['metan', 'propan', 'gas']
      const liquidTypes = ['benzin', 'dizel', 'diesel']
      
      if (gasTypes.includes(parsed.fuelType.toLowerCase())) {
        // Gaz turlari uchun faqat kub
        parsed.quantityUnit = 'kub'
      } else if (liquidTypes.includes(parsed.fuelType.toLowerCase())) {
        // Suyuq yoqilg'i uchun faqat litr
        parsed.quantityUnit = 'litr'
      }
    }
    
    // Agar fuelType yo'q lekin type fuel bo'lsa, default metan va kub
    if (parsed.type === 'fuel' && !parsed.fuelType) {
      parsed.fuelType = 'metan'
      parsed.quantityUnit = 'kub'
    }
    
    return parsed
  } catch (error) {
    console.error('LLM xatosi:', error)
    throw new Error('Matnni tahlil qilib bo\'lmadi: ' + error.message)
  }
}

/**
 * To'liq ovozli buyruq - ovozdan ma'lumotgacha
 * @param {Buffer} audioBuffer - Audio fayl
 * @param {string} language - Til
 * @param {string} context - Kontekst
 * @returns {Promise<{text: string, data: object, needsConfirmation: boolean}>}
 */
const processVoiceCommand = async (audioBuffer, language = 'uz', context = 'expense') => {
  // 1. Ovozni matnga
  const text = await transcribeAudio(audioBuffer, language)

  if (!text || text.length < 3) {
    throw new Error('Ovoz tanilmadi yoki juda qisqa')
  }

  // 2. Matnni tahlil qilish
  const data = await parseVoiceCommand(text, context)
  
  // 3. Tasdiqlash kerakligini aniqlash
  // Agar confidence past bo'lsa yoki muhim ma'lumotlar yo'q bo'lsa
  const needsConfirmation = 
    (data.confidence && data.confidence < 0.8) || // Past aniqlik
    (!data.amount && context === 'expense') || // Summa yo'q
    (!data.driverName && context === 'flight') // Haydovchi ismi yo'q

  return {
    text,
    data,
    needsConfirmation
  }
}

/**
 * Groq API mavjudligini tekshirish
 */
const isVoiceAIAvailable = () => {
  return !!process.env.GROQ_API_KEY
}

module.exports = {
  transcribeAudio,
  parseVoiceCommand,
  processVoiceCommand,
  isVoiceAIAvailable,
}
