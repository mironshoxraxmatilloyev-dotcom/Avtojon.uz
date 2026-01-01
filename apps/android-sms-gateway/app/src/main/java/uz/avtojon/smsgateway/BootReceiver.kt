package uz.avtojon.smsgateway

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/**
 * Telefon qayta ishga tushganda Service'ni avtomatik boshlash
 */
class BootReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val prefs = context.getSharedPreferences("sms_gateway", 0)
            val serverUrl = prefs.getString("server_url", "") ?: ""
            val token = prefs.getString("token", "") ?: ""
            
            // Agar sozlamalar mavjud bo'lsa, service'ni ishga tushirish
            if (serverUrl.isNotBlank() && token.isNotBlank()) {
                val serviceIntent = Intent(context, SmsGatewayService::class.java)
                ContextCompat.startForegroundService(context, serviceIntent)
            }
        }
    }
}
