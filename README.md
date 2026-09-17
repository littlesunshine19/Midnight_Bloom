# 🌙 Midnight Bloom

Juego arcade original de **plataformas + shooter** con scroll lateral, hecho con
**HTML5 + Canvas + JavaScript puro** (sin dependencias, sin build).
Estética pixel-art retro con paleta *Midnight Bloom*.

![Estado](https://img.shields.io/badge/estado-jugable-brightgreen)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue)
![Plataforma](https://img.shields.io/badge/plataforma-Web%20%7C%20M%C3%B3vil-purple)

---

## 📖 Historia

En **Nocturna**, una ciudad onírica atrapada en una noche eterna, la **Flor de
Medianoche** —que mantiene el equilibrio entre los sueños y la realidad— ha sido
fragmentada por una sombra antigua. Tú eres **Luma**, una guardiana de pétalos de
luz, y debes atravesar plataformas flotantes, esquivar enemigos patrulleros,
disparar proyectiles de energía y recolectar cristales para restaurar la flor y
devolver el color a la noche.

---

## 🎮 Controles

| Acción            | Teclado                     | Táctil        |
|-------------------|-----------------------------|---------------|
| Mover izquierda   | `A` / `←`                   | ◀             |
| Mover derecha     | `D` / `→`                   | ▶             |
| Saltar            | `W` / `↑` / `Espacio`       | ▲             |
| Disparar          | `J` / clic izquierdo        | ●             |
| Pausa             | `Esc`                       | botón `II`    |
| Reiniciar nivel   | `R`                         | —             |

---

## ▶️ Cómo ejecutarlo

### Requisitos
- Un navegador moderno (Chrome, Edge, Firefox o Safari).
- Opcional: **Python 3** o **Node.js** para servir el juego localmente.

### Opción A — Doble clic (la más simple)
1. Descarga o clona el repositorio.
2. Abre `index.html` en tu navegador.
3. ¡Listo! Funciona directamente porque el juego **no carga archivos externos**
   (imágenes/sonidos) en esta fase.

### Opción B — Servidor local (recomendada)
Necesaria si más adelante añades imágenes o sonidos desde `assets/`.

**Windows (PowerShell):**
```bash
python -m http.server 8080