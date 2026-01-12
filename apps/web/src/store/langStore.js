import { create } from 'zustand'

// Til sozlamalari - faqat shofyorlar uchun
export const useLangStore = create((set, get) => ({
    // 'uz' - lotin, 'ru' - kirill
    lang: localStorage.getItem('driver_lang') || 'uz',

    setLang: (lang) => {
        localStorage.setItem('driver_lang', lang)
        set({ lang })
    },

    // Tarjima olish
    t: (key) => {
        const lang = get().lang
        return translations[lang]?.[key] || translations.uz[key] || key
    },
}))

// Tarjimalar - shofyor paneli uchun
export const translations = {
    uz: {
        // Login
        welcome: 'Xush kelibsiz!',
        enterCredentials: "Hisobingizga kirish uchun ma'lumotlarni kiriting",
        username: 'Username',
        password: 'Parol',
        login: 'Kirish',
        noAccount: "Hisobingiz yo'qmi?",
        register: "Ro'yxatdan o'ting",
        backToHome: 'Bosh sahifaga',
        enterUsername: 'Username kiriting',
        enterPassword: 'Parol kiriting',
        minChars3: 'Kamida 3 ta belgi',
        minChars6: 'Kamida 6 ta belgi',
        loginError: 'Kirish xatosi',
        wrongCredentials: "Username yoki parol noto'g'ri",
        serverError: 'Serverga ulanishda xatolik',
        warning: 'Ogohlantirish',
        error: 'Xatolik',
        loading: 'Kirish...',
        hello: 'Salom',

        // Driver Panel
        driverPanel: 'Shofyor paneli',
        home: 'Asosiy',
        activeTrips: 'Faol reyslar',
        tripHistory: 'Tarix',
        profile: 'Profil',
        logout: 'Chiqish',
        noActiveTrips: "Faol marshrut yo'q",
        newTripNotify: 'Yangi marshrut tayinlanganda xabar olasiz',
        pendingTrips: 'Kutilayotgan reyslar',
        completedTrips: 'Tugatilgan marshrutlar',
        totalEarnings: 'Daromad',
        totalTrips: 'Jami reyslar',
        thisMonth: 'Bu oy',
        today: 'Bugun',
        currentBalance: 'Joriy balans',
        recentTrips: 'Oxirgi marshrutlar',
        historyEmpty: "Marshrutlar tarixi bo'sh",
        historyEmptyHint: "Birinchi marshrutingiz tayinlanganda bu yerda ko'rinadi",
        route: 'Marshrut',
        count: 'ta',
        share: 'Ulush',

        // Trip details
        from: 'Qayerdan',
        to: 'Qayerga',
        distance: 'Masofa',
        status: 'Holat',
        date: 'Sana',
        price: 'Narx',
        cargo: 'Yuk',
        weight: "Og'irlik",
        client: 'Mijoz',
        phone: 'Telefon',
        notes: 'Izohlar',

        // Statuses
        pending: 'Kutilmoqda',
        active: 'Faol',
        completed: 'Tugatilgan',
        cancelled: 'Bekor qilingan',

        // Actions
        accept: 'Qabul qilish',
        reject: 'Rad etish',
        start: 'Boshlash',
        finish: 'Yakunlash',
        cancel: 'Bekor qilish',
        confirm: 'Tasdiqlash',
        save: 'Saqlash',
        close: 'Yopish',

        // Language
        language: 'Til',
        uzbekLatin: "O'zbekcha",
        uzbekCyrillic: 'Кирилл',
    },

    ru: {
        // Login
        welcome: 'Хуш келибсиз!',
        enterCredentials: 'Ҳисобингизга кириш учун маълумотларни киритинг',
        username: 'Username',
        password: 'Парол',
        login: 'Кириш',
        noAccount: 'Ҳисобингиз йўқми?',
        register: 'Рўйхатдан ўтинг',
        backToHome: 'Бош саҳифага',
        enterUsername: 'Username киритинг',
        enterPassword: 'Парол киритинг',
        minChars3: 'Камида 3 та белги',
        minChars6: 'Камида 6 та белги',
        loginError: 'Кириш хатоси',
        wrongCredentials: 'Username ёки парол нотўғри',
        serverError: 'Серверга уланишда хатолик',
        warning: 'Огоҳлантириш',
        error: 'Хатолик',
        loading: 'Кириш...',
        hello: 'Салом',

        // Driver Panel
        driverPanel: 'Шофёр панели',
        home: 'Асосий',
        activeTrips: 'Фаол рейслар',
        tripHistory: 'Тарих',
        profile: 'Профил',
        logout: 'Чиқиш',
        noActiveTrips: 'Фаол маршрут йўқ',
        newTripNotify: 'Янги маршрут тайинланганда хабар оласиз',
        pendingTrips: 'Кутилаётган рейслар',
        completedTrips: 'Тугатилган маршрутлар',
        totalEarnings: 'Даромад',
        totalTrips: 'Жами рейслар',
        thisMonth: 'Бу ой',
        today: 'Бугун',
        currentBalance: 'Жорий баланс',
        recentTrips: 'Охирги маршрутлар',
        historyEmpty: 'Маршрутлар тарихи бўш',
        historyEmptyHint: 'Биринчи маршрутингиз тайинланганда бу ерда кўринади',
        route: 'Маршрут',
        count: 'та',
        share: 'Улуш',

        // Trip details
        from: 'Қаердан',
        to: 'Қаерга',
        distance: 'Масофа',
        status: 'Ҳолат',
        date: 'Сана',
        price: 'Нарх',
        cargo: 'Юк',
        weight: 'Оғирлик',
        client: 'Мижоз',
        phone: 'Телефон',
        notes: 'Изоҳлар',

        // Statuses
        pending: 'Кутилмоқда',
        active: 'Фаол',
        completed: 'Тугатилган',
        cancelled: 'Бекор қилинган',

        // Actions
        accept: 'Қабул қилиш',
        reject: 'Рад этиш',
        start: 'Бошлаш',
        finish: 'Якунлаш',
        cancel: 'Бекор қилиш',
        confirm: 'Тасдиқлаш',
        save: 'Сақлаш',
        close: 'Ёпиш',

        // Language
        language: 'Тил',
        uzbekLatin: 'Lotin',
        uzbekCyrillic: 'Кирилл',
    },
}

// Hook - tarjima olish uchun
export const useTranslation = () => {
    const { lang, t, setLang } = useLangStore()
    return { lang, t, setLang }
}
