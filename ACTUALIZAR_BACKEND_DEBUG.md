# 🔧 ACTUALIZAR BACKEND CON LOGS DE DEBUG

## 🎯 Lo Que Hice

Agregué **logs detallados** al endpoint de verificación OTP para ver exactamente dónde falla.

---

## 📋 EJECUTAR AHORA EN DIGITALOCEAN

```bash
# 1. Conectar
ssh root@tu-servidor-digitalocean

# 2. Actualizar backend
cd /home/desvare/desvare-proyect/backend
git pull origin main

# 3. Reiniciar
pm2 restart desvare-backend

# 4. Ver logs en tiempo real
pm2 logs desvare-backend
```

---

## 🧪 Después de Actualizar: Probar de Nuevo

### Paso 1: Registrarse

1. Ir a: https://desvare.app (incógnito)
2. Registrarse con:
   - Nombre: `TestDebug1`
   - Teléfono: `3008578866`
   - Email: `testdebug1@test.com`

### Paso 2: Esperar SMS

### Paso 3: Ingresar Código

### Paso 4: Ver Logs Detallados

Ahora los logs mostrarán:

```
🔐 Verificando OTP para usuario: 698e...
   📝 OTP recibido: 123456
🔍 Buscando usuario en DB...
✅ Usuario encontrado: 3008578866
🔄 Llamando a Twilio Verify...
📊 Resultado de Twilio: {
  success: false,
  error: "...",
  code: "...",
  status: "..."
}
❌ Error verificando OTP con Twilio: [mensaje exacto del error]
```

Esto nos dirá **EXACTAMENTE** qué está fallando.

---

## 🔍 Posibles Errores que Veremos

### Error 1: OTP ya verificado
```
Error: Max check attempts reached
Code: 20404
```
**Solución:** Solicitar nuevo OTP

### Error 2: OTP expirado
```
Error: Verification expired
```
**Solución:** Solicitar nuevo OTP (expira en 10 min)

### Error 3: Código incorrecto
```
Status: pending (no approved)
```
**Solución:** Verificar que el código sea correcto

---

## ⏰ Timeline

```
[Ahora]      Actualizar backend en DigitalOcean
[+30 seg]    Backend reiniciado
[+1 min]     Probar registro
[+2 min]     Ver logs detallados
[+3 min]     Identificar problema exacto
```

---

**Próximo paso:** Actualizar backend en DigitalOcean y probar de nuevo para ver los logs detallados.
