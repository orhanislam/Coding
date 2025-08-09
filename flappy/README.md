# Flappy Bird (Vanilla JS)

A self-contained Flappy Bird clone using HTML5 Canvas + JavaScript. No build step, just open it or serve statically.

## Run

- Option 1: Open `index.html` directly in a browser.
- Option 2: Serve the folder locally:
  
  ```bash
  python3 -m http.server 8000 -d /workspace/flappy
  # then open http://localhost:8000
  ```

## Controls
- Click / Tap / Space / Up Arrow to flap.
- R to restart after game over.

## Notes
- Best score is saved in `localStorage`.
- Canvas scales for HiDPI for crisp rendering.