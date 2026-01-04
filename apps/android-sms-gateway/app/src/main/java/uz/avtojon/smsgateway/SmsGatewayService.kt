package uz.avtojon.smsgateway

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.telephony.SmsManager
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

class SmsGatewayService : Service() {
    
    companion object {
        const val TAG = "SmsGateway"
        const val CHANNEL_ID = "sms_gateway_channel"
        const val NOTIFICATION_ID = 1
        
        var isRunning = false
    }
    
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var api: SmsGatewayApi? = null
    private var token: String = ""
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        isRunning = true
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val prefs = getSharedPreferences("sms_gateway", 0)
        val serverUrl = prefs.getString("server_url", "") ?: ""
        token = prefs.getString("token", "") ?: ""
        
        if (serverUrl.isBlank() || token.isBlank()) {
            stopSelf()
            return START_NOT_STICKY
        }
        
        // Retrofit setup
        val client = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
        
        api = Retrofit.Builder()
            .baseUrl(serverUrl.trimEnd('/') + "/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SmsGatewayApi::class.java)
        
        // Foreground notification
        val notification = createNotification("SMS Gateway ishlayapti")
        startForeground(NOTIFICATION_ID, notification)
        
        // Polling boshlash
        startPolling()
        
        return START_STICKY
    }
    
    private fun startPolling() {
        scope.launch {
            while (isActive) {
                try {
                    Log.d(TAG, "Polling... URL: ${api != null}, Token: ${token.take(10)}...")
                    
                    // Heartbeat
                    val heartbeatResponse = api?.heartbeat(token, HeartbeatRequest(Build.ID))
                    Log.d(TAG, "Heartbeat response: ${heartbeatResponse?.success}")
                    
                    // SMS navbatini olish
                    val response = api?.getQueue(token, 5)
                    Log.d(TAG, "Queue response: ${response?.data?.size ?: 0} messages")
                    val messages = response?.data ?: emptyList()
                    
                    for (sms in messages) {
                        sendSms(sms)
                        delay(2000) // 2 sekund kutish (spam bo'lmasligi uchun)
                    }
                    
                } catch (e: Exception) {
                    Log.e(TAG, "Polling error: ${e.message}", e)
                    e.printStackTrace()
                }
                
                delay(5000) // 5 sekundda bir tekshirish
            }
        }
    }
    
    private suspend fun sendSms(sms: SmsMessage) {
        try {
            val prefs = getSharedPreferences("sms_gateway", 0)
            // Default SIM 2 (Mobiuz) - index 1
            // SIM 1 = Beeline (index 0), SIM 2 = Mobiuz (index 1)
            val selectedSim = prefs.getInt("selected_sim", 1)
            
            val smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                getSystemService(SmsManager::class.java).createForSubscriptionId(getSubscriptionId(selectedSim))
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
            
            // Uzun SMS uchun multipart ishlatish
            val parts = smsManager.divideMessage(sms.message)
            if (parts.size > 1) {
                // Uzun SMS - bir nechta qismga bo'lingan, lekin bitta SMS sifatida yuboriladi
                smsManager.sendMultipartTextMessage(
                    sms.phone,
                    null,
                    parts,
                    null,
                    null
                )
            } else {
                // Qisqa SMS
                smsManager.sendTextMessage(
                    sms.phone,
                    null,
                    sms.message,
                    null,
                    null
                )
            }
            
            // Status yuborish
            api?.updateStatus(token, StatusUpdate(sms.id, "sent", null))
            
            Log.d(TAG, "SMS yuborildi: ${sms.phone} (SIM ${selectedSim + 1}, ${parts.size} qism)")
            updateNotification("Oxirgi SMS: ${sms.phone}")
            
            // Log saqlash
            saveSmsLog(sms.phone, sms.message, "sent")
            
        } catch (e: Exception) {
            Log.e(TAG, "SMS yuborishda xato: ${e.message}")
            
            // Xato status
            api?.updateStatus(token, StatusUpdate(sms.id, "failed", e.message))
            
            saveSmsLog(sms.phone, sms.message, "failed")
        }
    }
    
    private fun saveSmsLog(phone: String, message: String, status: String) {
        val prefs = getSharedPreferences("sms_logs", 0)
        val logs = prefs.getString("logs", "") ?: ""
        val newLog = "$phone|$message|$status|${System.currentTimeMillis()}"
        
        // Oxirgi 50 ta logni saqlash
        val allLogs = (newLog + "\n" + logs).lines().take(50).joinToString("\n")
        prefs.edit().putString("logs", allLogs).apply()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SMS Gateway",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "SMS Gateway xizmati"
            }
            
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(text: String): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Avtojon SMS Gateway")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }
    
    private fun updateNotification(text: String) {
        val notification = createNotification(text)
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, notification)
    }
    
    // SIM subscription ID olish
    private fun getSubscriptionId(simSlot: Int): Int {
        try {
            val subscriptionManager = getSystemService(android.telephony.SubscriptionManager::class.java)
            val subscriptionInfoList = subscriptionManager.activeSubscriptionInfoList
            if (subscriptionInfoList != null && subscriptionInfoList.size > simSlot) {
                return subscriptionInfoList[simSlot].subscriptionId
            }
        } catch (e: Exception) {
            Log.e(TAG, "SIM subscription olishda xato: ${e.message}")
        }
        return -1 // Default
    }
    
    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
        isRunning = false
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}

// API Interface
interface SmsGatewayApi {
    @POST("api/sms/gateway/heartbeat")
    suspend fun heartbeat(
        @Header("X-Gateway-Token") token: String,
        @Body request: HeartbeatRequest
    ): ApiResponse<Any>
    
    @GET("api/sms/gateway/queue")
    suspend fun getQueue(
        @Header("X-Gateway-Token") token: String,
        @Query("limit") limit: Int
    ): ApiResponse<List<SmsMessage>>
    
    @POST("api/sms/gateway/status")
    suspend fun updateStatus(
        @Header("X-Gateway-Token") token: String,
        @Body status: StatusUpdate
    ): ApiResponse<Any>
}

// Data classes
data class HeartbeatRequest(val deviceId: String)
data class SmsMessage(val id: String, val phone: String, val message: String)
data class StatusUpdate(val id: String, val status: String, val errorMessage: String?)
data class ApiResponse<T>(val success: Boolean, val data: T?, val message: String?)
