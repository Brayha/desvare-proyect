# 📚 Documentación del Proyecto Desvare

Bienvenido a la documentación técnica del proyecto Desvare. Esta carpeta contiene toda la información necesaria para entender, desarrollar, desplegar y mantener el proyecto.

## 📋 Documentos Disponibles

### 🎯 Documentación Esencial

#### 1. [CONFIGURACION_ACTUAL.md](./CONFIGURACION_ACTUAL.md)
**¿Qué contiene?**
- Estado actual del proyecto
- URLs de producción (Frontend y Backend)
- Variables de entorno completas
- Configuración de Vercel y Nginx
- Estructura de proyectos después del desacoplamiento
- Endpoints principales de la API
- Comandos útiles para desarrollo

**¿Cuándo consultarlo?**
- Al configurar entorno de desarrollo
- Al verificar URLs o endpoints
- Al necesitar variables de entorno
- Al trabajar con deployment

---

#### 2. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
**¿Qué contiene?**
- Guía completa de deployment para Vercel (Frontend)
- Guía completa de deployment para DigitalOcean (Backend)
- Configuración inicial de servidores
- Proceso paso a paso para deployments
- Checklist de deployment
- Proceso de rollback (revertir cambios)

**¿Cuándo consultarlo?**
- Al hacer deployment de cualquier componente
- Al configurar nuevos proyectos en Vercel
- Al necesitar hacer rollback
- Al configurar servidor nuevo

---

#### 3. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
**¿Qué contiene?**
- Soluciones a problemas comunes
- Errores de Frontend (Vercel)
- Errores de Backend (DigitalOcean)
- Problemas de OTP/Autenticación
- Problemas de Tracking/Socket.IO
- Errores de Base de Datos
- Comandos de diagnóstico

**¿Cuándo consultarlo?**
- Cuando algo no funciona
- Al recibir errores en logs
- Al debuggear problemas
- Al enfrentar errores conocidos

---

### 🏗️ Documentación Técnica Adicional

#### 4. [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)
Configuración de Google Maps API, restricciones de API keys, y uso en el proyecto.

#### 5. [INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)
Guía de instalación inicial del proyecto en entorno local.

#### 6. [REALTIME_COMMUNICATION.md](./REALTIME_COMMUNICATION.md)
Documentación de Socket.IO, tracking en tiempo real, y eventos de comunicación.

#### 7. [SEQUENCE_DIAGRAM.md](./SEQUENCE_DIAGRAM.md)
Diagramas de secuencia de flujos principales del sistema.

#### 8. [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
Resumen ejecutivo del proyecto, objetivos, y alcance.

---

## 🚀 Guía Rápida según tu Necesidad

### "Necesito configurar mi entorno local"
1. Lee `INSTALLATION_GUIDE.md`
2. Consulta `CONFIGURACION_ACTUAL.md` para variables de entorno
3. Verifica `TROUBLESHOOTING.md` si encuentras errores

### "Voy a hacer un deployment"
1. Lee `DEPLOYMENT_GUIDE.md` completo
2. Sigue el checklist de deployment
3. Ten abierto `TROUBLESHOOTING.md` por si hay problemas

### "Algo no funciona"
1. Abre `TROUBLESHOOTING.md`
2. Busca el problema en el índice
3. Sigue los pasos de diagnóstico y solución
4. Si persiste, consulta `CONFIGURACION_ACTUAL.md` para verificar configuración

### "Necesito entender cómo funciona X"
1. Para arquitectura general: `ARCHITECTURE.md` (raíz del proyecto)
2. Para tracking en tiempo real: `REALTIME_COMMUNICATION.md`
3. Para Google Maps: `GOOGLE_MAPS_SETUP.md`
4. Para flujos del sistema: `SEQUENCE_DIAGRAM.md`

---

## 📂 Estructura del Proyecto

```
desvare-proyect/
├── README.md                    # Info general del proyecto
├── ARCHITECTURE.md              # Arquitectura del sistema
├── docs/                        # 📁 ESTA CARPETA
│   ├── README.md               # Este archivo
│   ├── CONFIGURACION_ACTUAL.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── TROUBLESHOOTING.md
│   ├── GOOGLE_MAPS_SETUP.md
│   ├── INSTALLATION_GUIDE.md
│   ├── REALTIME_COMMUNICATION.md
│   ├── SEQUENCE_DIAGRAM.md
│   └── PROJECT_SUMMARY.md
├── archive/                     # Archivos históricos
│   ├── fixes/
│   ├── deployments/
│   ├── implementations/
│   └── sessions/
├── client-pwa/                  # PWA de clientes
├── driver-app/                  # PWA de conductores
├── admin-dashboard/             # Panel administrativo
└── backend/                     # API REST + Socket.IO
```

---

## 🔍 Búsqueda Rápida

### Por Tema

| Tema | Documento |
|------|-----------|
| Variables de entorno | CONFIGURACION_ACTUAL.md |
| Deployment Vercel | DEPLOYMENT_GUIDE.md |
| Deployment Backend | DEPLOYMENT_GUIDE.md |
| Error 404 en Vercel | TROUBLESHOOTING.md |
| OTP no funciona | TROUBLESHOOTING.md |
| Socket.IO | REALTIME_COMMUNICATION.md |
| Google Maps | GOOGLE_MAPS_SETUP.md |
| Configuración Nginx | CONFIGURACION_ACTUAL.md |
| PM2 comandos | DEPLOYMENT_GUIDE.md |
| Rollback | DEPLOYMENT_GUIDE.md |

### Por Tipo de Usuario

**👨‍💻 Desarrollador Frontend:**
- CONFIGURACION_ACTUAL.md (URLs y variables)
- TROUBLESHOOTING.md (Errores de Vercel)
- GOOGLE_MAPS_SETUP.md
- REALTIME_COMMUNICATION.md (Socket.IO)

**🖥️ Desarrollador Backend:**
- CONFIGURACION_ACTUAL.md (Configuración servidor)
- DEPLOYMENT_GUIDE.md (Deploy backend)
- TROUBLESHOOTING.md (Errores PM2/Nginx)
- REALTIME_COMMUNICATION.md (Socket.IO)

**🚀 DevOps / Deployment:**
- DEPLOYMENT_GUIDE.md (completo)
- CONFIGURACION_ACTUAL.md (todas las configs)
- TROUBLESHOOTING.md (diagnóstico)

**🆕 Nuevo en el Proyecto:**
1. README.md (raíz)
2. ARCHITECTURE.md (raíz)
3. PROJECT_SUMMARY.md (docs)
4. INSTALLATION_GUIDE.md (docs)
5. CONFIGURACION_ACTUAL.md (docs)

---

## 🔄 Mantenimiento de la Documentación

### ¿Cuándo actualizar?

**CONFIGURACION_ACTUAL.md:**
- Al cambiar variables de entorno
- Al agregar/modificar URLs
- Al cambiar configuración de Vercel o Nginx
- Al agregar nuevos endpoints

**DEPLOYMENT_GUIDE.md:**
- Al cambiar proceso de deployment
- Al agregar nuevos pasos
- Al actualizar versiones de Node.js u otras dependencias

**TROUBLESHOOTING.md:**
- Al encontrar un nuevo error recurrente
- Al descubrir una solución efectiva
- Al actualizar comandos de diagnóstico

### ¿Cómo actualizar?

1. Editar el archivo correspondiente
2. Actualizar la fecha en el encabezado
3. Agregar nota de cambio si es significativo
4. Hacer commit:
```bash
git add docs/
git commit -m "docs: Actualizar [nombre del documento]"
git push origin main
```

---

## 📞 Documentación Adicional

### En el repositorio
- **README.md** (raíz): Información general del proyecto
- **ARCHITECTURE.md** (raíz): Arquitectura técnica detallada

### Archivos históricos
- **archive/**: Documentación histórica y temporal (no consultar para info actual)

---

## 💡 Tips

- **Ctrl/Cmd + F:** Usa la búsqueda en los archivos para encontrar rápidamente lo que necesitas
- **Marcadores:** Marca esta página y los documentos que uses más frecuentemente
- **Mermaid:** Algunos diagramas usan sintaxis Mermaid para visualización
- **Código:** Los bloques de código tienen indicadores del lenguaje para syntax highlighting

---

## ✅ Checklist de Onboarding

Si eres nuevo en el proyecto, marca estos items:

- [ ] Leí el README.md principal
- [ ] Revisé ARCHITECTURE.md para entender la arquitectura
- [ ] Configuré mi entorno local con INSTALLATION_GUIDE.md
- [ ] Tengo las variables de entorno de CONFIGURACION_ACTUAL.md
- [ ] Sé dónde buscar cuando algo falla (TROUBLESHOOTING.md)
- [ ] Entiendo el proceso de deployment (DEPLOYMENT_GUIDE.md)
- [ ] Conozco las URLs de producción
- [ ] Tengo acceso a Vercel, DigitalOcean y MongoDB Atlas

---

**Última actualización:** 14 de febrero de 2026

Para más información o preguntas, consultar con el equipo de desarrollo.
