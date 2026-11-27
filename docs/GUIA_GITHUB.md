# Guía para subir FitControl a GitHub (Heidy y Julián)

Repositorio: https://github.com/HeidyCardenas1903/fitcontrol

La docente revisa el historial de commits para ver qué hizo cada integrante. Por eso **cada uno sube su parte con su propia cuenta**, en commits separados. Sigan los pasos en este orden.

## 0. Antes de empezar (los dos)

1. Instalar **Git** (https://git-scm.com) y **Node.js 20 o superior** (https://nodejs.org).
2. Configurar Git con su nombre y el correo de su cuenta de GitHub (una sola vez por computador):

   ```bash
   git config --global user.name "Su Nombre"
   git config --global user.email "correo-de-su-cuenta@github"
   ```

3. **Julián:** aceptar la invitación al repositorio. Llega al correo julianemirog@gmail.com, o se puede aceptar en https://github.com/HeidyCardenas1903/fitcontrol/invitations

## 1. Heidy: estructura inicial

Descomprima `fitcontrol-heidy.zip` en una carpeta llamada `fitcontrol`. Primero suba solo los archivos base:

```bash
cd fitcontrol
git init
git branch -M main
git remote add origin https://github.com/HeidyCardenas1903/fitcontrol.git
git add README.md .gitignore
git commit -m "docs: README y estructura inicial del proyecto FitControl"
git push -u origin main
```

## 2. Julián: back-end

```bash
git clone https://github.com/HeidyCardenas1903/fitcontrol.git
cd fitcontrol
```

Descomprima `fitcontrol-julian.zip` dentro de esa carpeta (debe quedar `fitcontrol/backend/`). Haga varios commits pequeños para que se vea el avance:

```bash
git add backend/package.json backend/package-lock.json backend/.env.example backend/src/db.js
git commit -m "feat(backend): esquema de base de datos SQLite y datos de prueba"

git add backend/src/middleware backend/src/reglas.js
git commit -m "feat(backend): autenticación JWT, validaciones, manejo de errores y reglas del negocio"

git add backend/src/routes backend/src/app.js backend/src/server.js backend/src/seed.js backend/src/swagger.js
git commit -m "feat(backend): API REST de afiliados, membresías, clases y reservas con Swagger"

git add backend/tests
git commit -m "test(backend): pruebas unitarias y de integración de la API"

git push
```

Comprobar que funciona: `cd backend && npm install && npm test`, luego `npm run dev` y abrir http://localhost:4000/api/docs

## 3. Heidy: front-end

```bash
git pull          # trae el back-end de Julián
```

Copie la carpeta `frontend/`, la carpeta `.github/` y los archivos de `docs/` del zip. Luego:

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/index.html frontend/.env.example frontend/src/main.jsx frontend/src/styles.css
git commit -m "feat(frontend): proyecto React con Vite y estilos de la interfaz"

git add frontend/src/services frontend/src/context frontend/src/hooks
git commit -m "feat(frontend): Axios, Context API con useReducer y hook useApi"

git add frontend/src/components frontend/src/pages frontend/src/App.jsx
git commit -m "feat(frontend): páginas, rutas protegidas y navegación"

git add frontend/src/__tests__ .github
git commit -m "test(frontend): pruebas de componentes y flujo de despliegue en GitHub Pages"

git add docs
git commit -m "docs: documento de la Actividad 4 y capturas"
git push
```

## 4. Publicar el front-end (opcional, recomendado)

En GitHub: **Settings → Pages → Source: GitHub Actions**. El flujo se ejecuta solo al hacer push. La app queda en https://heidycardenas1903.github.io/fitcontrol/

Para que la versión publicada tenga datos, hay que desplegar también el back-end, por ejemplo en Render:

1. En Render, crear un **Web Service** conectado al repositorio.
2. Carpeta raíz: `backend`. Comando de compilación: `npm install`. Comando de inicio: `npm start`.
3. Variables: `JWT_SECRET` (un texto largo cualquiera) y `CORS_ORIGIN=https://heidycardenas1903.github.io`.
4. En GitHub, ir a **Settings → Secrets and variables → Actions → Variables** y crear `VITE_API_URL=https://<su-servicio>.onrender.com/api`.
5. Volver a ejecutar el flujo en la pestaña **Actions**.

## 5. Entrega

- Abran el documento Word, revísenlo, expórtenlo a PDF y súbanlo en la Actividad 4.
- El enlace del repositorio ya está en el documento (sección 1.1).
