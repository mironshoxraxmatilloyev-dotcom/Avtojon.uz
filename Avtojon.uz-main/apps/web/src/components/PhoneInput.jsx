import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

export default function PhoneInputField({ 
  value, 
  onChange, 
  placeholder = "Telefon raqam",
  className = "",
  inputClass = "",
  containerClass = "",
  disabled = false
}) {
  return (
    <PhoneInput
      country={'uz'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      enableSearch={true}
      searchPlaceholder="Davlatni qidirish..."
      searchNotFound="Topilmadi"
      preferredCountries={['uz', 'kz', 'ru']}
      containerClass={`phone-input-container ${containerClass}`}
      inputClass={`phone-input-field ${inputClass}`}
      buttonClass="phone-input-button"
      dropdownClass="phone-input-dropdown"
      inputStyle={{
        width: '100%',
        height: '48px',
        fontSize: '16px',
        paddingLeft: '48px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff'
      }}
      buttonStyle={{
        borderRadius: '12px 0 0 12px',
        border: '1px solid #e5e7eb',
        borderRight: 'none',
        backgroundColor: '#f9fafb'
      }}
      dropdownStyle={{
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
      }}
    />
  )
}

// Dark theme uchun variant
export function PhoneInputDark({ 
  value, 
  onChange, 
  placeholder = "Telefon raqam",
  disabled = false
}) {
  return (
    <PhoneInput
      country={'uz'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      enableSearch={true}
      searchPlaceholder="Davlatni qidirish..."
      searchNotFound="Topilmadi"
      preferredCountries={['uz', 'kz', 'ru']}
      inputStyle={{
        width: '100%',
        height: '52px',
        fontSize: '16px',
        paddingLeft: '48px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: '#fff'
      }}
      buttonStyle={{
        borderRadius: '12px 0 0 12px',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRight: 'none',
        backgroundColor: 'rgba(255,255,255,0.05)'
      }}
      dropdownStyle={{
        borderRadius: '12px',
        backgroundColor: '#1e293b',
        color: '#fff',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}
      searchStyle={{
        backgroundColor: '#334155',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    />
  )
}
