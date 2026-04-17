package com.desvare.driver;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.PowerManager;
import android.provider.Settings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Registrar plugins ANTES de super.onCreate() (requisito de Capacitor)
        registerPlugin(LocationTrackingPlugin.class);

        super.onCreate(savedInstanceState);

        // CRÍTICO: Habilitar debugging de WebView para Chrome DevTools
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        // Solicitar exención de optimización de batería.
        // Muestra el diálogo nativo del sistema (como los permisos de ubicación).
        // Si el usuario ya concedió el permiso, no aparece de nuevo.
        new Handler().postDelayed(this::requestIgnoreBatteryOptimization, 2000);
    }

    /**
     * Muestra el diálogo nativo de Android para eximir la app de la
     * optimización de batería (Doze / App Standby / Samsung Device Care).
     * Solo aparece cuando el permiso NO ha sido concedido aún.
     */
    private void requestIgnoreBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String packageName = getPackageName();
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(packageName)) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + packageName));
                startActivity(intent);
            }
        }
    }
}
