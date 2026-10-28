# ChatProfeAlex

Aplicación web de tutoría académica en ingeniería, construida con React + Vite.

## Publicación en GitHub Pages

La configuración ya está preparada para desplegar en GitHub Pages con la ruta base correcta para un repositorio llamado `ChatProfeAlex`.

### Archivos clave
- `vite.config.ts`: define `base: '/ChatProfeAlex/'`
- `.github/workflows/deploy.yml`: workflow automático de despliegue
- `.nojekyll`: evita que GitHub procese archivos con Jekyll

### Pasos para publicar
1. Sube este proyecto a un repositorio de GitHub con el nombre `ChatProfeAlex`.
2. En GitHub, entra a `Settings` > `Pages`.
3. En `Build and deployment`, selecciona `GitHub Actions`.
4. Haz push a la rama `main` y el workflow se desplegará automáticamente.

### Desarrollo local
```bash
npm install
npm run dev
```

### Build de producción
```bash
npm run build
```
