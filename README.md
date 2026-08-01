# Cantoral Santa Lucía

Aplicación web para los **Coros Parroquiales de Santa Lucía**. Elige la celebración del día y genera al azar la lista completa de cantos de la misa, respetando las reglas litúrgicas del cantoral (Gloria omitido en Adviento y Cuaresma, salmos propios de Semana Santa, marianos en la salida, etc.).

El repertorio son **899 cantos** con su letra y sus acordes, tomados de los diez cuadernos del cantoral parroquial.

No necesita internet, ni servidor, ni instalación: es HTML, CSS y JavaScript puro.

## Cómo usarla

1. Abre `index.html` con doble clic (Chrome, Edge, Firefox o Safari).
2. Toca la celebración: **Tiempos litúrgicos** (Adviento, Navidad, Ordinario, Cuaresma, Pascua, Pentecostés) o **Fiestas y solemnidades** (Nuestro Señor, Nuestra Señora, San José, Ángeles, Apóstoles, Mártires, Pastores, Vírgenes, Religiosos, Santos en general). Toda la interfaz cambia al color litúrgico correspondiente.
3. Pulsa **Generar lista de cantos**. Se propone un canto para cada puesto: Entrada, Señor ten piedad, Gloria, Salmo y aclamación, Ofertorio, Santo, Cordero de Dios, Comunión I y II, y Salida.
4. Sobre cada tarjeta:
   - **tócala** para ver la letra completa con los acordes;
   - pulsa **↻** para cambiar sólo ese canto por otro apropiado.
5. **Copiar lista** deja los títulos por puesto en el portapapeles, listos para pegar en WhatsApp o en el guion de la misa.

Ningún canto se repite dentro de la misma lista, y los dos cantos de comunión son siempre distintos entre sí.

## Archivos

```
cantoral-app/
├─ index.html        estructura de la app
├─ css/styles.css    estilos y variables de tema
├─ js/cantos.js      datos: canciones, celebraciones, puestos y preferencias
├─ js/app.js         lógica: selección aleatoria, temas, panel de letra
└─ data/raw/*.json   fuentes originales del cantoral
```

Para añadir o corregir cantos se edita `js/cantos.js` (o las fuentes de `data/raw/`); la app no requiere ningún otro cambio.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `cantoral-santa-lucia`), público.
2. Sube el contenido de la carpeta `cantoral-app` a la raíz del repositorio: con `git`

   ```bash
   cd cantoral-app
   git init
   git add .
   git commit -m "Cantoral Santa Lucía"
   git branch -M main
   git remote add origin https://github.com/USUARIO/cantoral-santa-lucia.git
   git push -u origin main
   ```

   o bien con **Add file → Upload files** desde la web de GitHub, arrastrando `index.html` y las carpetas `css`, `js` y `data`.
3. En el repositorio: **Settings → Pages**. En *Source* elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`. Guarda.
4. Al cabo de un minuto la app queda en `https://USUARIO.github.io/cantoral-santa-lucia/`. Ese enlace se puede compartir con el coro y añadir a la pantalla de inicio del móvil.

> Es importante que `index.html` esté en la raíz de lo que se publica; si se sube la carpeta `cantoral-app` entera, la dirección será `https://USUARIO.github.io/cantoral-santa-lucia/cantoral-app/`.
