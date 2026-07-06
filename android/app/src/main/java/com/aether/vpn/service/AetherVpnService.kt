package com.aether.vpn.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import com.aether.vpn.MainActivity
import com.aether.vpn.model.VpnConfig
import com.aether.vpn.model.VpnProtocol
import com.aether.vpn.protocols.OpenVpnManager
import com.aether.vpn.protocols.V2RayManager
import com.aether.vpn.protocols.WireGuardManager
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException

class AetherVpnService : VpnService() {
    private val TAG = "AetherVpnService"
    private val CHANNEL_ID = "AetherVpnChannel"
    private val NOTIFICATION_ID = 1001

    private var mInterface: ParcelFileDescriptor? = null
    private var vpnThread: Thread? = null

    // Managers for diverse protocols
    private lateinit var wireGuardManager: WireGuardManager
    private lateinit var openVpnManager: OpenVpnManager
    private lateinit var v2RayManager: V2RayManager

    companion object {
        const val ACTION_CONNECT = "com.aether.vpn.CONNECT"
        const val ACTION_DISCONNECT = "com.aether.vpn.DISCONNECT"
        const val EXTRA_CONFIG = "com.aether.vpn.EXTRA_CONFIG"
    }

    override fun onCreate() {
        super.onCreate()
        wireGuardManager = WireGuardManager(this)
        openVpnManager = OpenVpnManager(this)
        v2RayManager = V2RayManager(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null) {
            when (intent.action) {
                ACTION_CONNECT -> {
                    val config = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        intent.getSerializableExtra(EXTRA_CONFIG, VpnConfig::class.java)
                    } else {
                        @Suppress("DEPRECATION")
                        intent.getSerializableExtra(EXTRA_CONFIG) as? VpnConfig
                    }
                    if (config != null) {
                        startVpn(config)
                    }
                }
                ACTION_DISCONNECT -> {
                    stopVpn()
                }
            }
        }
        return START_STICKY
    }

    private fun startVpn(config: VpnConfig) {
        // Start foreground service notifications
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification(config))

        // Intercept/Divert packets based on protocols
        vpnThread = Thread({
            try {
                Log.i(TAG, "Securing Virtual NIC via ${config.protocol.name}")
                
                // Establish VPN Interface with Netmask and MTU
                val builder = Builder()
                    .addAddress("10.0.0.2", 32)
                    .addRoute("0.0.0.0", 0) // Full routing
                    .setSession("AetherSecureSession")
                    .setMtu(1420)

                mInterface = builder.establish()
                Log.i(TAG, "Aether Secure Virtual NIC up & listening on fd: ${mInterface?.fd}")

                // Run protocol specific engines
                when (config.protocol) {
                    VpnProtocol.WIREGUARD -> {
                        wireGuardManager.startTunnel(config) { logLine ->
                            sendLogsToApp(logLine)
                        }
                    }
                    VpnProtocol.OPENVPN -> {
                        openVpnManager.startTunnel(config) { logLine ->
                            sendLogsToApp(logLine)
                        }
                    }
                    VpnProtocol.V2RAY -> {
                        v2RayManager.startTunnel(config) { logLine ->
                            sendLogsToApp(logLine)
                        }
                    }
                }

                // Packet loop forwarding (SOCKS5 forwarding, raw bypass sockets, or custom tun tap processing)
                runPacketLoop()

            } catch (e: Exception) {
                Log.e(TAG, "VPN Engine launch error", e)
                sendLogsToApp("[WARNING] Native engine launch failure: ${e.message}")
                stopVpn()
            }
        }, "AetherVpnWorker")

        vpnThread?.start()
    }

    private fun runPacketLoop() {
        // High efficiency packet interceptor for non-wireguard go-tun forwarding
        val fd = mInterface?.fileDescriptor ?: return
        val input = FileInputStream(fd)
        val output = FileOutputStream(fd)
        val packet = ByteArray(32768)

        try {
            while (vpnThread != null && !vpnThread!!.isInterrupted) {
                // Read outbound IP packet from Android OS TUN
                val length = input.read(packet)
                if (length > 0) {
                    // Inject, proxy or encrypt packet. 
                    // In a production Go/Rust backend, native core manages packet queue routing.
                    // Here, we simulate successful loopback transit
                }
                Thread.sleep(10)
            }
        } catch (e: IOException) {
            Log.e(TAG, "Virtual TUN interface I/O interrupt", e)
        }
    }

    private fun stopVpn() {
        Log.i(TAG, "Stopping service and resetting routing rules.")
        
        // Stop current sub-daemons
        wireGuardManager.stopTunnel { sendLogsToApp(it) }
        openVpnManager.stopTunnel { sendLogsToApp(it) }
        v2RayManager.stopTunnel { sendLogsToApp(it) }

        vpnThread?.interrupt()
        vpnThread = null

        try {
            mInterface?.close()
            mInterface = null
        } catch (e: Exception) {
            Log.e(TAG, "Error closing virtual NIC FD", e)
        }

        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun sendLogsToApp(logLine: String) {
        val intent = Intent("com.aether.vpn.LOG_UPDATE")
        intent.putExtra("log", logLine)
        sendBroadcast(intent)
    }

    private fun buildNotification(config: VpnConfig): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Aether VPN - Protected")
            .setContentText("Connected to ${config.serverName} via ${config.protocol.name}")
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentIntent(pendingIntent)
            .setCategory(Notification.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Aether VPN Service Channel",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    override fun onDestroy() {
        stopVpn()
        super.onDestroy()
    }
}

// Boot Receiver class to trigger auto connect
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (Intent.ACTION_BOOT_COMPLETED == intent.action) {
            Log.i("BootReceiver", "Boot Complete detected. Checking Auto-Connect profiles.")
            // Logic to launch AetherVpnService automatically if marked in SharedPreferences
        }
    }
}
