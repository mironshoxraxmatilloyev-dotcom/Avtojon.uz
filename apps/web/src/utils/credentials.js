// Credential Management API - brauzer parol menejerida saqlash
// Bu Google/Apple account bilan sync bo'ladi va telefon tozalasa ham saqlanib qoladi

const SITE_ID = 'avtojon.uz'

// Credential API mavjudligini tekshirish
export const isCredentialAPISupported = () => {
  return 'credentials' in navigator && 'PasswordCredential' in window
}

// Parolni brauzer menejeriga saqlash
export const saveCredentials = async (username, password) => {
  if (!isCredentialAPISupported()) {
    console.log('Credential API qo\'llab-quvvatlanmaydi')
    return false
  }

  try {
    const credential = new PasswordCredential({
      id: username,
      password: password,
      name: username,
    })

    await navigator.credentials.store(credential)
    console.log('Credentials saved to browser')
    return true
  } catch (error) {
    console.error('Credential saqlashda xato:', error)
    return false
  }
}

// Saqlangan parolni olish (avtomatik login uchun)
export const getStoredCredentials = async () => {
  if (!isCredentialAPISupported()) {
    return null
  }

  try {
    const credential = await navigator.credentials.get({
      password: true,
      mediation: 'optional' // 'silent' - so'ramasdan, 'optional' - kerak bo'lsa so'raydi
    })

    if (credential && credential.type === 'password') {
      return {
        username: credential.id,
        password: credential.password
      }
    }
    return null
  } catch (error) {
    console.error('Credential olishda xato:', error)
    return null
  }
}

// Silent mode - foydalanuvchiga so'ramasdan olish
export const getSilentCredentials = async () => {
  if (!isCredentialAPISupported()) {
    return null
  }

  try {
    const credential = await navigator.credentials.get({
      password: true,
      mediation: 'silent'
    })

    if (credential && credential.type === 'password') {
      return {
        username: credential.id,
        password: credential.password
      }
    }
    return null
  } catch (error) {
    // Silent mode da xato bo'lsa - normal holat
    return null
  }
}

// Logout da credential ni "unutish"
export const preventAutoSignIn = async () => {
  if (!isCredentialAPISupported()) {
    return
  }

  try {
    await navigator.credentials.preventSilentAccess()
  } catch (error) {
    console.error('preventSilentAccess xato:', error)
  }
}
