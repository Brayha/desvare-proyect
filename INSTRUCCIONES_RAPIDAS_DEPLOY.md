# 🚀 Instrucciones Rápidas: Desplegar Usuarios Duales

## ⚡ Despliegue Rápido (5 minutos)

### 1. Conectarse al servidor
```bash
ssh root@64.23.162.115
```

### 2. Ir al directorio del backend
```bash
cd /root/desvare-proyect/backend
```

### 3. Actualizar código
```bash
git pull origin main
```

### 4. Eliminar índice antiguo de MongoDB

Ejecutar en la terminal:
```bash
node
```

Copiar y pegar en la consola de Node.js:
```javascript
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const User = mongoose.connection.collection('users');
    try {
      await User.dropIndex('phone_1');
      console.log('✅ Índice phone_1 eliminado');
    } catch (error) {
      console.log('ℹ️ Índice phone_1 no existe');
    }
    process.exit(0);
  });
```

Presionar `Ctrl+D` para salir de Node.js

### 5. Reiniciar PM2
```bash
pm2 restart desvare-backend
```

### 6. Verificar logs
```bash
pm2 logs desvare-backend --lines 20
```

---

## ✅ ¡Listo!

Ahora puedes probar:

1. **Registrarte como conductor** en Driver App
2. **Registrarte como cliente** con el **mismo teléfono** en la PWA
3. Ambas cuentas deben funcionar correctamente

---

## 🐛 Si algo sale mal

### Ver logs completos:
```bash
pm2 logs desvare-backend --lines 50
```

### Verificar estado de PM2:
```bash
pm2 status
```

### Reiniciar de nuevo:
```bash
pm2 restart desvare-backend
```

---

## 📄 Documentación Completa

Si necesitas más detalles, consulta:
- `DEPLOY_USUARIOS_DUALES.md` - Guía completa paso a paso
- `IMPLEMENTACION_USUARIOS_DUALES.md` - Documentación técnica
- `RESUMEN_USUARIOS_DUALES_2026_02_11.md` - Resumen ejecutivo

---

**Tiempo estimado:** 5 minutos  
**Riesgo:** Bajo  
**Cambios:** 3 archivos backend
