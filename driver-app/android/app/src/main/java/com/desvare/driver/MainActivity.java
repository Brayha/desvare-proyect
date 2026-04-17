package com.desvare.driver;

import android.os.Build;
import android.os.Bundle;
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
        // La solicitud de exención de batería ahora la gestiona BatteryPermissionModal.jsx
        // que muestra primero la pantalla explicativa y luego llama al plugin nativo.
    }
}
