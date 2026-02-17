# 📁 Archive - Archivos Históricos del Proyecto

Este directorio contiene archivos de documentación temporal y histórica que fueron creados durante el desarrollo del proyecto pero que ya no son necesarios para las operaciones diarias.

## 📋 Estructura

```
archive/
├── fixes/              # Correcciones y hotfixes históricos
├── deployments/        # Guías de deployment temporales
├── implementations/    # Documentación de implementaciones pasadas
└── sessions/          # Resúmenes de sesiones de desarrollo
```

## 🗂️ Descripción de Carpetas

### `/fixes/`
Contiene documentación de correcciones de bugs y hotfixes aplicados históricamente:
- FIX_*.md - Correcciones de errores específicos
- SOLUCION_*.md - Soluciones implementadas
- HOTFIX_*.md - Correcciones críticas rápidas

### `/deployments/`
Guías temporales de deployment y configuración:
- DEPLOY_*.md - Instrucciones de deployment
- PASOS_*.md - Pasos para configuración
- INSTRUCCIONES_*.md - Instrucciones específicas
- COMANDOS_*.md - Comandos ejecutados

### `/implementations/`
Documentación de implementaciones de features:
- IMPLEMENTACION_*.md - Documentación de implementaciones
- FASE_*.md - Fases de desarrollo
- GUIA_*.md - Guías de implementación
- CHECKLIST_*.md - Checklists de tareas
- TEST_*.md - Pruebas realizadas
- CONFIGURACION_*.md - Configuraciones antiguas

### `/sessions/`
Resúmenes y análisis de sesiones de desarrollo:
- RESUMEN_*.md - Resúmenes de sesiones
- ANALISIS_*.md - Análisis técnicos
- DIAGNOSTICO_*.md - Diagnósticos de problemas

## ⚠️ Importante

- **NO ELIMINAR:** Estos archivos pueden contener información útil para referencia histórica
- Los archivos en este directorio **NO** son parte de la documentación activa del proyecto
- Para documentación actual, consultar la carpeta `/docs/` en la raíz del proyecto
- Para arquitectura actual, consultar `ARCHITECTURE.md` y `README.md` en la raíz

## 🔍 Búsqueda

Para buscar información específica en estos archivos históricos:

```bash
# Buscar palabra clave en todos los archivos
grep -r "palabra_clave" archive/

# Buscar en archivos de fixes
grep -r "error_específico" archive/fixes/

# Buscar en archivos de implementación
grep -r "feature_nombre" archive/implementations/
```

## 📅 Fecha de Archivo

**Fecha de creación de esta estructura:** 14 de febrero de 2026

Los archivos fueron movidos aquí como parte de una limpieza y organización del proyecto para mantener la raíz limpia y enfocada en documentación activa.

---

Para documentación actualizada, consultar:
- `/docs/CONFIGURACION_ACTUAL.md` - Configuración actual del proyecto
- `/docs/DEPLOYMENT_GUIDE.md` - Guía de deployment actualizada
- `/docs/TROUBLESHOOTING.md` - Solución de problemas comunes
- `ARCHITECTURE.md` - Arquitectura del sistema
- `README.md` - Información general del proyecto
