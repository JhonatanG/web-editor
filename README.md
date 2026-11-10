# Editor Bootstrap 5

Editor visual (GrapesJS 0.23.6 + Bootstrap 5.3) para diseñar sitios web completos y descargarlos en un ZIP listo para subir a cualquier alojamiento. Es estático: `index.html`, `css/` y `js/`, sin compilar ni servidor.

## Publicar el editor (Cloudflare Workers u otro alojamiento estático)

Sube `index.html`, `css/` y `js/`. Para usarlo en tu equipo basta con abrirlo con Live Server o cualquier servidor de archivos.

## Qué se puede hacer

- **Secciones** (primera pestaña): hero, servicios, portafolio, testimonios, preguntas frecuentes, contacto, llamadas a la acción, interactivos, menú y pie. Cada una tiene miniatura y vista previa con los colores y tipografías del sitio.
  - Se insertan antes o después de la sección elegida, al final, o arrastrándolas al lienzo.
  - Cada inserción se deshace con un Ctrl+Z.
  - Filas, columnas y textos sueltos están en **Bloques**.
- **Componentes vinculados** (menú, pie, tarjetas, llamadas a la acción):
  - Se editan una vez y cambian en todas las páginas.
  - Cada copia puede cambiar textos, enlaces e imágenes y volver a heredarlos.
  - Al abrir proyectos anteriores, los menús distintos se conservan hasta que decidas vincularlos (*Páginas → Vincular menú/pie*).
- **Inspector adaptable:**
  - Ancho exacto o arrastrando el borde del lienzo.
  - Rango de estilos (Escritorio / Tablet / Móvil) independiente del ancho.
  - **Ajustes adaptables** que indican si cada valor es local, heredado o del diseño, y se pueden restablecer.
  - Paneles plegables con Ctrl+[ y Ctrl+].
- **Interacciones:** *Cuando* clic / foco / entra en pantalla → *sobre este elemento* → *ejecuta* abrir, cerrar, alternar, ir a, cambiar estado o guardar variable, con condiciones simples.
  - Incluye menú móvil, acordeón y modal accesibles: teclado, foco y movimiento reducido.
  - Funcionan igual en la vista previa y en el sitio exportado.
- **Revisar:** enlaces y anclas rotas, imágenes sin texto alternativo, campos sin etiqueta y desbordes a 375, 768 y 1280 px. Cada aviso lleva al elemento.
- **Vista previa:** muestra el mismo HTML que el ZIP, en un iframe aislado. Ctrl+P sigue probando en el lienzo.
- **Exportar sitio (ZIP):** incluye `LEEME.txt` con lo que depende de servicios externos (Google Fonts, el CDN de Bootstrap si no se incluye, mapas, videos…).
- **Formularios:** validan y muestran los estados enviando, éxito y error. Envían por correo o a otra dirección como Formspree (*Sitio → Formularios*).
- **Proyectos .json:** se abren los de versiones anteriores, se validan antes de cargar y se guardan con `__formato: 2`. **Importar HTML** quita scripts, atributos `on…` y enlaces `javascript:`.

## Pruebas

```bash
pip install playwright
python -m http.server 8765 --bind 127.0.0.1
EDITOR_URL=http://127.0.0.1:8765 python pruebas/prueba_fase1_secciones.py
```

Otras: `prueba_fase2_inspector.py`, `prueba_formato_anterior.py`, `prueba_sin_servidor.py` y las de regresión (`prueba_flujo_completo.py`, `prueba_menu.py`…).
