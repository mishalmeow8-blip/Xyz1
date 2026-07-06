package com.aether.vpn

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.VpnService
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aether.vpn.model.VpnConfig
import com.aether.vpn.model.VpnProtocol
import com.aether.vpn.service.AetherVpnService

class MainActivity : ComponentActivity() {

    private var isConnected by mutableStateOf(false)
    private var logs = mutableStateListOf<String>()
    
    // Default config placeholder
    private var selectedConfig by mutableStateOf(
        VpnConfig(
            serverName = "Frankfurt Main Sec-1",
            countryCode = "DE",
            protocol = VpnProtocol.WIREGUARD,
            remoteAddress = "46.101.218.42",
            remotePort = 51820,
            wgPrivateKey = "eA8+O1/gVvXWhPymkO7n99x3V55gI8fK0uJ97VzK928=",
            wgPublicKey = "gT8+A2/fVsXWhQymkO7n99x3V55gI8fK0uJ97VzK928=",
            wgAddress = "10.0.0.2/32",
            v2rayUuid = "b84f3cbb-cf86-4e08-96d0-6644485593c2"
        )
    )

    // Android VPN service consent contract launcher
    private val vpnPrepareLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            startVpnService()
        } else {
            logs.add("[WARNING] User denied VPN interface creation consent.")
        }
    }

    private val logReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            intent?.getStringExtra("log")?.let {
                logs.add(it)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Add initial system boot diagnostics
        logs.add("[SYSTEM] Aether Secure Overlay client initialized.")
        logs.add("[SYSTEM] WireGuard, OpenVPN & V2Ray engines armed.")

        // Register telemetry log stream receiver
        val filter = IntentFilter("com.aether.vpn.LOG_UPDATE")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(logReceiver, filter, RECEIVER_EXPORTED)
        } else {
            registerReceiver(logReceiver, filter)
        }

        setContent {
            AetherVpnTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF0A0A0B)
                ) {
                    VpnDashboardScreen(
                        isConnected = isConnected,
                        selectedConfig = selectedConfig,
                        logs = logs,
                        onConnectToggle = { toggleVpn() },
                        onProtocolChange = { proto ->
                            selectedConfig = selectedConfig.copy(
                                protocol = proto,
                                remotePort = when (proto) {
                                    VpnProtocol.WIREGUARD -> 51820
                                    VpnProtocol.OPENVPN -> 1194
                                    VpnProtocol.V2RAY -> 443
                                }
                            )
                            logs.add("[SYSTEM] Switched active link suite protocol to: ${proto.name}")
                        },
                        onServerChange = { name, address, cc ->
                            selectedConfig = selectedConfig.copy(
                                serverName = name,
                                remoteAddress = address,
                                countryCode = cc
                            )
                            logs.add("[SYSTEM] Target Gateway updated to: $name ($address)")
                        }
                    )
                }
            }
        }
    }

    private fun toggleVpn() {
        if (isConnected) {
            stopVpnService()
        } else {
            // Android OS requires runtime user authorization to open VPN TUN adapter
            val vpnIntent = VpnService.prepare(this)
            if (vpnIntent != null) {
                vpnPrepareLauncher.launch(vpnIntent)
            } else {
                startVpnService()
            }
        }
    }

    private fun startVpnService() {
        logs.add("[SYSTEM] Handshaking secure sockets pipeline...")
        val intent = Intent(this, AetherVpnService::class.java).apply {
            action = AetherVpnService.ACTION_CONNECT
            putExtra(AetherVpnService.EXTRA_CONFIG, selectedConfig)
        }
        startService(intent)
        isConnected = true
    }

    private fun stopVpnService() {
        logs.add("[SYSTEM] Tearing down virtual interfaces...")
        val intent = Intent(this, AetherVpnService::class.java).apply {
            action = AetherVpnService.ACTION_DISCONNECT
        }
        startService(intent)
        isConnected = false
    }

    override fun onDestroy() {
        unregisterReceiver(logReceiver)
        super.onDestroy()
    }
}

@Composable
fun VpnDashboardScreen(
    isConnected: Boolean,
    selectedConfig: VpnConfig,
    logs: List<String>,
    onConnectToggle: () -> Unit,
    onProtocolChange: (VpnProtocol) -> Unit,
    onServerChange: (String, String, String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // App Header
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "AETHER OVERLAY",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.SansSerif
                )
                Text(
                    text = "Multi-Protocol Secure Gateway",
                    color = Color(0xFF555866),
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (isConnected) Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFFFF453A).copy(alpha = 0.15f))
                    .border(1.dp, if (isConnected) Color(0xFF10B981).copy(alpha = 0.3f) else Color(0xFFFF453A).copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 10.dp, vertical = 5.dp)
            ) {
                Text(
                    text = if (isConnected) "PROTECTED" else "UNSECURED",
                    color = if (isConnected) Color(0xFF10B981) else Color(0xFFFF453A),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Large Circular Connection Toggle
        Box(
            modifier = Modifier
                .size(190.dp)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        colors = if (isConnected) {
                            listOf(Color(0xFF2563EB).copy(alpha = 0.3f), Color(0xFF0F0F12))
                        } else {
                            listOf(Color(0xFF1F1F24), Color(0xFF0A0A0B))
                        }
                    )
                )
                .clickable { onConnectToggle() }
                .border(2.dp, if (isConnected) Color(0xFF2563EB) else Color(0xFF2E2E3A), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = Icons.Filled.PowerSettingsNew,
                    contentDescription = "Connection Toggle",
                    tint = if (isConnected) Color(0xFF2563EB) else Color(0xFF6B7280),
                    modifier = Modifier.size(54.dp)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = if (isConnected) "DISCONNECT" else "TAP TO CONNECT",
                    color = if (isConnected) Color(0xFF2563EB) else Color(0xFF9CA3AF),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(28.dp))

        // Protocol Selector Tab Row
        Text(
            text = "VPN PROTOCOL SUITE",
            color = Color(0xFF9CA3AF),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp),
            textAlign = TextAlign.Start
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFF15151A))
                .padding(4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            VpnProtocol.values().forEach { protocol ->
                val active = selectedConfig.protocol == protocol
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (active) Color(0xFF2563EB) else Color.Transparent)
                        .clickable { onProtocolChange(protocol) }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = protocol.name,
                        color = if (active) Color.White else Color(0xFF9CA3AF),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Config Gateway Card
        Text(
            text = "SECURE GATEWAY NODE",
            color = Color(0xFF9CA3AF),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp),
            textAlign = TextAlign.Start
        )
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F0F12))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF15151A)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Public,
                                contentDescription = "Server Node",
                                tint = Color(0xFF2563EB),
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = selectedConfig.serverName,
                                color = Color.White,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "IP: ${selectedConfig.remoteAddress}:${selectedConfig.remotePort}",
                                color = Color(0xFF6B7280),
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                    
                    // Simple server chooser dropdown trigger
                    Icon(
                        imageVector = Icons.Filled.ArrowForwardIos,
                        contentDescription = "Switch Node",
                        tint = Color(0xFF6B7280),
                        modifier = Modifier
                            .size(14.dp)
                            .clickable {
                                // Rotate realistic mock node addresses for demonstration
                                val servers = listOf(
                                    Triple("New York Cloud Edge", "157.230.82.10", "US"),
                                    Triple("Frankfurt Main Sec-1", "46.101.218.42", "DE"),
                                    Triple("Singapore G-Node", "128.199.230.12", "SG")
                                )
                                val current = servers.random()
                                onServerChange(current.first, current.second, current.third)
                            }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Logs Terminal Panel
        Text(
            text = "TUNNEL TELEMETRY CONSOLE",
            color = Color(0xFF9CA3AF),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp),
            textAlign = TextAlign.Start
        )
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFF070709))
                .border(1.dp, Color(0xFF15151C), RoundedCornerShape(16.dp))
                .padding(12.dp)
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                reverseLayout = true
            ) {
                items(logs.reversed()) { logLine ->
                    val color = when {
                        logLine.startsWith("[OK]") -> Color(0xFF3B82F6)
                        logLine.startsWith("[WARNING]") -> Color(0xFFFF453A)
                        logLine.startsWith("[SYSTEM]") -> Color(0xFF5A5C70)
                        else -> Color(0xFFD1D5DB)
                    }
                    Text(
                        text = logLine,
                        color = color,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.fillMaxWidth().padding(vertical = 1.5.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun AetherVpnTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFF2563EB),
            background = Color(0xFF0A0A0B),
            surface = Color(0xFF0F0F12)
        ),
        content = content
    )
}
