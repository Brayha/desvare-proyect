# 🚀 PASOS PARA DESPLEGAR TWILIO VERIFY A PRODUCCIÓN

**Fecha:** 9 de febrero de 2026  
**Tiempo estimado:** 5 minutos

---

## ✅ PREREQUISITOS

- [x] Código con Twilio Verify implementado
- [x] Credenciales de Twilio configuradas localmente
- [x] Commit creado en git
- [ ] Push a GitHub (hazlo ahora)

---

## 📝 PASO A PASO

### 1️⃣ Push a GitHub (EN TU MAC)

```bash
cd ~/Documents/desvare-proyect
git push origin main
```

**Nota:** Te pedirá usuario y contraseña/token de GitHub.

---

### 2️⃣ Conectar al Servidor

```bash
ssh root@desvare.app
```

---

### 3️⃣ Ir al Directorio del Backend

```bash
cd /root/desvare-proyect/backend
```

---

### 4️⃣ Pull del Código Nuevo

```bash
git pull origin main
```

**Deberías ver:**
```
Updating xxxxx..a989ff6
Fast-forward
 backend/models/User.js                | ...
 backend/services/sms.js               | 179 ++++++++++++
 ...
 7 files changed, 1114 insertions(+), 20 deletions(-)
```

---

### 5️⃣ Instalar Twilio

```bash
npm install
```

**Deberías ver:**
```
added 9 packages, and audited 449 packages in 7s
```

---

### 6️⃣ Configurar Variables de Entorno

```bash
nano .env
```

**Busca la sección de Twilio y actualiza/agrega:**

```bash
# Twilio Verify (para OTP - funciona en Colombia)
TWILIO_ACCOUNT_SID=AC76c4d35ca07b7e6b5367866898af95
TWILIO_AUTH_TOKEN=2e8c46e3105a0e4b30fffb2e64574a9b
TWILIO_VERIFY_SERVICE_SID=VAb8c7c5794adc9930367857aa9501d15a
```

**Si ya existe una sección de Twilio con `TWILIO_PHONE_NUMBER`, reemplázala completamente.**

**Guardar:**
- `Ctrl + O` (guardar)
- `Enter` (confirmar)
- `Ctrl + X` (salir)

---

### 7️⃣ Reiniciar Backend

```bash
pm2 restart backend
```

---

### 8️⃣ Verificar Logs

```bash
pm2 logs backend --lines 50
```

**Busca este mensaje (debe aparecer):**

```
✅ Twilio Verify inicializado correctamente
   Service SID: VAb8c7c5794adc9930367857aa9501d15a
```

**Si lo ves, ¡TODO ESTÁ FUNCIONANDO! ✅**

---

## 🧪 PROBAR EN PRODUCCIÓN

### Desde tu Celular o Navegador:

1. Ve a: **https://app.desvare.app/register**

2. Ingresa:
   - **Nombre:** Tu nombre
   - **Teléfono:** Tu número real (ej: `3001234567`)

3. Click en **"Registrar"**

4. **Deberías recibir un SMS** en tu celular con un código de 6 dígitos:
   ```
   Your Desvare OTP verification code is: 123456
   ```

5. Ingresa el código en la app

6. Si funciona, ¡LISTO! ✅

---

## 🔍 TROUBLESHOOTING

### No veo el mensaje de Twilio en los logs

**Solución:**
```bash
# Ver más líneas
pm2 logs backend --lines 100

# O filtrar solo Twilio
pm2 logs backend | grep Twilio
```

### Error: "Twilio Verify no configurado"

**Causa:** Variables no están en `.env`

**Solución:**
```bash
nano .env
# Verifica que las 3 variables estén presentes
```

### No me llega el SMS

**Posibles causas:**

1. **Número incorrecto:** Verifica que sea tu número real de 10 dígitos
2. **Twilio no inicializado:** Revisa logs con `pm2 logs backend`
3. **MongoDB no conectado:** Verifica que MongoDB esté funcionando

**Ver logs específicos del registro:**
```bash
pm2 logs backend | grep "Registro OTP"
```

---

## 📊 COMANDOS ÚTILES

### Ver logs en tiempo real
```bash
pm2 logs backend
```

### Ver solo errores
```bash
pm2 logs backend --err
```

### Reiniciar si algo falla
```bash
pm2 restart backend
```

### Ver estado de PM2
```bash
pm2 status
```

### Ver variables de entorno cargadas
```bash
pm2 env backend
```

---

## ✅ CHECKLIST FINAL

- [ ] Push a GitHub exitoso
- [ ] SSH al servidor
- [ ] Git pull completado
- [ ] npm install ejecutado
- [ ] Variables en .env configuradas
- [ ] PM2 reiniciado
- [ ] Logs muestran "Twilio Verify inicializado"
- [ ] Prueba de registro exitosa
- [ ] SMS recibido
- [ ] Código verificado correctamente

---

## 🎉 ¡LISTO!

Si completaste todos los pasos y recibiste el SMS, **Twilio Verify está funcionando en producción**.

Ahora todos los usuarios (clientes y conductores) recibirán códigos OTP reales por SMS cuando se registren o inicien sesión.

---

## 💰 RECORDATORIO DE COSTOS

- **Verificación por SMS:** $0.05 USD cada una
- **No hay costo mensual** (no necesitas número de teléfono)
- **Ejemplo:** 100 registros = $5 USD

---

## 📞 SOPORTE

Si tienes problemas, revisa:

1. **Logs del backend:** `pm2 logs backend`
2. **Documentación:** `IMPLEMENTACION_TWILIO_VERIFY.md`
3. **Dashboard de Twilio:** https://console.twilio.com/us1/monitor/logs/verify

---

**¡Buena suerte con el despliegue! 🚀**
