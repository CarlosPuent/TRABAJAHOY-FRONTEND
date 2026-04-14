# 🧑‍💻 Portal de Trabajo - TRABAJAHOY

Portal web **TrabajaHoy**, enfocado en la gestión de usuarios (candidatos y empresas) con una arquitectura limpia basada en vistas independientes.

---

Arquitectura Frontend
Cada vista tiene su propio:
HTML
CSS
No se utiliza un style.css global gigante
Esto permite:
mejor mantenimiento
escalabilidad
separación clara de responsabilidades
Diseño UI/UX

El diseño está basado en prototipos de Figma, priorizando:

consistencia visual
espaciados precisos
tipografía uniforme (Inter)
componentes reutilizables (inputs, botones, layouts)

Cómo ejecutar el proyecto

Puedes usarlo en dos modos:

- Prototipos HTML en `views/` sin backend.
- SPA Vite (`src/`) consumiendo API backend.

## Entorno local (SPA)

1. Crea un archivo `.env.local` en la raiz del proyecto.
2. Agrega la variable:

`VITE_API_BASE_URL=http://localhost:3000/api`

3. Inicia el frontend:

`npm install`

`npm run dev`

Si no defines `VITE_API_BASE_URL`, en desarrollo se usa por defecto `http://localhost:3000/api`.
En produccion se mantiene el backend de Railway.

Opciones:

1. Abrir directamente
   Abrir cualquier index.html en el navegador

Ejemplo:

views/landing/index.html
views/login/index.html 2. Usar Live Server (recomendado)

Licencia

Este proyecto es de uso educativo/profesional.
