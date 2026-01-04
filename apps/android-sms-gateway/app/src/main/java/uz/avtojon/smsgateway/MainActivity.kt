package uz.avtojon.smsgateway

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.all { it.value }
        if (allGranted) {
            Toast.makeText(this, "Barcha ruxsatlar berildi", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "SMS yuborish uchun ruxsat kerak", Toast.LENGTH_LONG).show()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Ruxsatlarni so'rash
        checkAndRequestPermissions()
        
        setContent {
            SmsGatewayApp()
        }
    }
    
    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.SEND_SMS,
            Manifest.permission.READ_PHONE_STATE
        )
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        
        val notGranted = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        
        if (notGranted.isNotEmpty()) {
            requestPermissionLauncher.launch(notGranted.toTypedArray())
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SmsGatewayApp() {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("sms_gateway", 0) }
    val scope = rememberCoroutineScope()
    
    var serverUrl by remember { mutableStateOf(prefs.getString("server_url", "") ?: "") }
    var token by remember { mutableStateOf(prefs.getString("token", "") ?: "") }
    var isConnected by remember { mutableStateOf(false) }
    var smsLogs by remember { mutableStateOf(listOf<SmsLog>()) }
    
    // Service status
    LaunchedEffect(Unit) {
        isConnected = SmsGatewayService.isRunning
    }
    
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFF8B5CF6),
            surface = Color(0xFF1E1E2E),
            background = Color(0xFF0F0F1A)
        )
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { 
                        Text("Avtojon SMS Gateway", fontWeight = FontWeight.Bold) 
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color(0xFF1E1E2E)
                    )
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF0F0F1A))
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Status Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isConnected) Color(0xFF1A3D2E) else Color(0xFF2D1F1F)
                    ),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (isConnected) Icons.Default.Wifi else Icons.Default.WifiOff,
                            contentDescription = null,
                            tint = if (isConnected) Color(0xFF4ADE80) else Color(0xFFF87171),
                            modifier = Modifier.size(32.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = if (isConnected) "Ulangan" else "Ulanmagan",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                            Text(
                                text = if (isConnected) "Server bilan aloqa mavjud" else "Serverga ulanish kerak",
                                color = Color.White.copy(alpha = 0.7f),
                                fontSize = 14.sp
                            )
                        }
                    }
                }
                
                // Settings
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E2E)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    // Default SIM 2 (Mobiuz) - index 1
                    var selectedSim by remember { mutableStateOf(prefs.getInt("selected_sim", 1)) }
                    
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Sozlamalar",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        
                        OutlinedTextField(
                            value = serverUrl,
                            onValueChange = { serverUrl = it },
                            label = { Text("Server URL") },
                            placeholder = { Text("https://avtojon.uz") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFF8B5CF6),
                                unfocusedBorderColor = Color.White.copy(alpha = 0.3f)
                            )
                        )
                        
                        OutlinedTextField(
                            value = token,
                            onValueChange = { token = it },
                            label = { Text("Gateway Token") },
                            placeholder = { Text("Token ni kiriting") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFF8B5CF6),
                                unfocusedBorderColor = Color.White.copy(alpha = 0.3f)
                            )
                        )
                        
                        // SIM tanlash
                        Text(
                            text = "SMS yuborish uchun SIM",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 14.sp
                        )
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // SIM 1 - Beeline
                            FilterChip(
                                selected = selectedSim == 0,
                                onClick = { 
                                    selectedSim = 0
                                    prefs.edit().putInt("selected_sim", 0).apply()
                                },
                                label = { Text("SIM 1 (Beeline)") },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Color(0xFFFBBF24),
                                    selectedLabelColor = Color.Black
                                )
                            )
                            
                            // SIM 2 - Mobiuz
                            FilterChip(
                                selected = selectedSim == 1,
                                onClick = { 
                                    selectedSim = 1
                                    prefs.edit().putInt("selected_sim", 1).apply()
                                },
                                label = { Text("SIM 2 (Mobiuz)") },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Color(0xFF8B5CF6),
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                        
                        Button(
                            onClick = {
                                // Saqlash
                                prefs.edit()
                                    .putString("server_url", serverUrl)
                                    .putString("token", token)
                                    .apply()
                                
                                // Service'ni ishga tushirish/to'xtatish
                                val intent = Intent(context, SmsGatewayService::class.java)
                                if (!isConnected) {
                                    if (serverUrl.isNotBlank() && token.isNotBlank()) {
                                        ContextCompat.startForegroundService(context, intent)
                                        isConnected = true
                                        Toast.makeText(context, "Gateway ishga tushdi", Toast.LENGTH_SHORT).show()
                                    } else {
                                        Toast.makeText(context, "URL va Token kiriting", Toast.LENGTH_SHORT).show()
                                    }
                                } else {
                                    context.stopService(intent)
                                    isConnected = false
                                    Toast.makeText(context, "Gateway to'xtatildi", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isConnected) Color(0xFFDC2626) else Color(0xFF8B5CF6)
                            ),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(
                                imageVector = if (isConnected) Icons.Default.Stop else Icons.Default.PlayArrow,
                                contentDescription = null
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(if (isConnected) "To'xtatish" else "Ulash")
                        }
                    }
                }
                
                // SMS Logs
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E2E)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Oxirgi SMS'lar",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = "${smsLogs.size} ta",
                                color = Color.White.copy(alpha = 0.5f),
                                fontSize = 14.sp
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        if (smsLogs.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .weight(1f),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "SMS'lar yo'q",
                                    color = Color.White.copy(alpha = 0.5f)
                                )
                            }
                        } else {
                            LazyColumn(
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(smsLogs) { log ->
                                    SmsLogItem(log)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SmsLogItem(log: SmsLog) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF0F0F1A), RoundedCornerShape(8.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = when (log.status) {
                "sent" -> Icons.Default.Check
                "failed" -> Icons.Default.Close
                else -> Icons.Default.Schedule
            },
            contentDescription = null,
            tint = when (log.status) {
                "sent" -> Color(0xFF4ADE80)
                "failed" -> Color(0xFFF87171)
                else -> Color(0xFFFBBF24)
            },
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = log.phone,
                color = Color.White,
                fontWeight = FontWeight.Medium,
                fontSize = 14.sp
            )
            Text(
                text = log.message.take(50) + if (log.message.length > 50) "..." else "",
                color = Color.White.copy(alpha = 0.6f),
                fontSize = 12.sp
            )
        }
        Text(
            text = log.time,
            color = Color.White.copy(alpha = 0.4f),
            fontSize = 12.sp
        )
    }
}

data class SmsLog(
    val phone: String,
    val message: String,
    val status: String,
    val time: String
)
