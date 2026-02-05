# 🎯 Desvare Admin Dashboard

Panel de administración completo para gestionar conductores, clientes y servicios de la plataforma Desvare.

## 🚀 Estado del Proyecto

✅ **COMPLETADO** - Dashboard funcional con autenticación y gestión de conductores

## 📋 Características Implementadas

### ✅ Autenticación
- Login seguro con email y contraseña
- JWT con expiración de 24h
- Middleware de protección de rutas
- Logout automático en token expirado

### ✅ Dashboard Principal
- 6 KPIs en tiempo real:
  - Total de clientes
  - Conductores (total, activos, pendientes)
  - Servicios (completados, en curso)
  - Ingresos totales
  - Rating promedio
- Lista de servicios activos
- Actualización en tiempo real

### ✅ Gestión de Conductores
- Lista completa con filtros (todos, pendientes, aprobados, rechazados)
- Búsqueda por nombre o teléfono
- Detalle completo del conductor
- Visualización de documentos
- **Aprobar/Rechazar** conductores pendientes
- Ver historial de servicios

### 🎨 UI/UX
- Sidebar con navegación
- Header con información del admin
- Diseño responsive
- Componentes reutilizables
- Estilos modernos con gradientes

---

## 🔐 Credenciales de Acceso

**Email:** `desvareweb@gmail.com`  
**Contraseña:** `admin123*`  
**Rol:** `super_admin`

---

## 📦 Instalación

### 1. Ya están instaladas las dependencias ✅

Las dependencias ya fueron instaladas automáticamente.

### 2. Verificar que el backend esté corriendo

```bash
# En una terminal (puerto 5001)
cd backend
npm run dev
```

### 3. Ejecutar el Admin Dashboard

```bash
# En otra terminal (puerto 5174)
cd admin-dashboard
npm run dev
```

### 4. Acceder al Dashboard

Abre tu navegador en: **http://localhost:5174**

---

## 🗂️ Estructura del Proyecto

```
admin-dashboard/
├── src/
│   ├── pages/
│   │   ├── Login.jsx              # Página de login
│   │   ├── Dashboard.jsx          # Dashboard principal con KPIs
│   │   ├── Drivers.jsx            # Lista de conductores
│   │   └── DriverDetail.jsx       # Detalle y aprobación
│   │
│   ├── components/
│   │   ├── Sidebar.jsx            # Menú lateral
│   │   └── Header.jsx             # Header con usuario
│   │
│   ├── services/
│   │   └── adminAPI.js            # Cliente API
│   │
│   ├── App.jsx                    # Router y rutas protegidas
│   └── main.jsx                   # Entry point
│
├── index.html
├── package.json
├── vite.config.js
└── .env                           # Variables de entorno
```

---

## 🔌 API Endpoints del Backend

### Autenticación
- `POST /api/admin/login` - Login de admin

### Dashboard
- `GET /api/admin/stats` - Obtener KPIs
- `GET /api/admin/services/active` - Servicios en curso

### Conductores
- `GET /api/admin/drivers` - Lista de conductores
- `GET /api/admin/drivers/:id` - Detalle de conductor
- `PUT /api/admin/drivers/:id/approve` - Aprobar conductor
- `PUT /api/admin/drivers/:id/reject` - Rechazar conductor
- `PUT /api/admin/drivers/:id/suspend` - Suspender conductor
- `POST /api/admin/drivers/:id/notes` - Agregar notas

---

## 🧪 Cómo Probar

### 1. Login
1. Abre http://localhost:5174/login
2. Ingresa las credenciales:
   - Email: `desvareweb@gmail.com`
   - Password: `admin123*`
3. Click en "Ingresar al Dashboard"

### 2. Dashboard Principal
- Verás los KPIs actualizados
- Lista de servicios activos (si hay)

### 3. Gestión de Conductores
1. Click en "Conductores" en el sidebar
2. Verás la lista de conductores registrados
3. Usa los filtros:
   - **Pendientes**: Conductores en revisión
   - **Aprobados**: Conductores activos
   - **Rechazados**: Conductores rechazados
4. Click en un conductor para ver su detalle

### 4. Aprobar un Conductor
1. Ve a la lista de conductores
2. Filtra por "Pendientes"
3. Click en un conductor pendiente
4. Revisa sus documentos
5. Click en "✅ Aprobar Conductor" o "❌ Rechazar"

---

## 🎨 Componentes Principales

### `Login.jsx`
- Autenticación con email/password
- Validación de campos
- Redirección automática si ya está autenticado

### `Dashboard.jsx`
- 6 KPIs en tarjetas
- Servicios activos en tiempo real
- Formateo de moneda colombiana

### `Drivers.jsx`
- Lista paginada de conductores
- Filtros por estado
- Búsqueda por nombre/teléfono
- Badges de estado visual

### `DriverDetail.jsx`
- Información completa del conductor
- Visualización de documentos
- Acciones de aprobar/rechazar
- Historial de servicios

### `Sidebar.jsx`
- Navegación principal
- Logo y branding
- Botón de logout

### `Header.jsx`
- Título dinámico
- Información del admin logueado
- Notificaciones (placeholder)

---

## 🎯 Próximos Pasos (Opcionales)

### Funcionalidades Adicionales
- [ ] Gestión de clientes
- [ ] Gestión de servicios
- [ ] Reportes y analíticas
- [ ] Exportar a Excel/PDF
- [ ] Configuración de tarifas
- [ ] Gestión de admins secundarios
- [ ] Notificaciones en tiempo real (Socket.IO)
- [ ] Mapa con conductores activos
- [ ] Chat en vivo con conductores/clientes

### Mejoras Técnicas
- [ ] Tests unitarios
- [ ] Tests E2E
- [ ] CI/CD
- [ ] Dockerización
- [ ] Deploy a producción

---

## 🐛 Troubleshooting

### El backend no responde
```bash
# Verificar que el backend esté en puerto 5001
lsof -i :5001

# Verificar variables de entorno
cat backend/.env
```

### Error de autenticación
- Verifica que el admin exista en la DB
- Ejecuta el script de inicialización:
```bash
cd backend
node scripts/initAdmin.js
```

### Puerto 5174 en uso
```bash
# Cambiar el puerto en vite.config.js
server: {
  port: 5175, // Cambiar aquí
}
```

---

## 📝 Notas Importantes

1. **Seguridad**: Las credenciales están hardcodeadas para desarrollo. En producción, implementar:
   - Variables de entorno
   - Rotación de contraseñas
   - MFA (Multi-Factor Authentication)
   - Rate limiting

2. **Performance**: Para listas grandes de conductores/servicios:
   - Implementar paginación en backend
   - Lazy loading de imágenes
   - Virtual scrolling

3. **Real-time**: Actualmente las stats son estáticas. Para actualizaciones en tiempo real:
   - Integrar Socket.IO
   - Polling cada X segundos
   - Server-Sent Events (SSE)

---

## 👨‍💻 Desarrollado por

**Desvare Team**  
Dashboard Admin v1.0.0

---

## 🎉 ¡Listo para usar!

El dashboard está completamente funcional y listo para gestionar tu plataforma Desvare.

Para acceder:
1. Asegúrate que el backend esté corriendo (`npm run dev` en `/backend`)
2. Ejecuta el admin dashboard (`npm run dev` en `/admin-dashboard`)
3. Abre http://localhost:5174
4. Inicia sesión con las credenciales proporcionadas

**¡Feliz administración!** 🚀

