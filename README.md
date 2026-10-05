# ALIVE — Rebuild

This is the clean rebuild of ALIVE.

The previous prototype is not the foundation anymore. The new project is built around one idea: the woman herself must feel inhabited before any interface or environmental effect is added.

## Core idea

The photograph is preserved, but it is no longer treated as one indivisible image. The source has been prepared into layered visual regions:

- base room / background
- body and shoulders
- face
- left and right eye surfaces
- left and right irises
- left and right brows
- mouth

A single canvas renderer composes those layers every frame. Pointer attention moves the irises; the eyelids close during a blink; brows and mouth change with expression; the head and shoulders breathe and settle.

## Run

```bash
npm install
npm run dev
```

The current runtime does not require API credits.

## Quality gate

Do not add decorative effects unless the character already feels alive with the environment quiet.

The first test is always a silent five-second observation.
