# ALIVE — Rebuild Plan

ALIVE is being rebuilt from first principles.

## The goal

The website must feel like a character inhabiting a place, not a static image with effects around it.

The character is the hero. The room supports her. The UI stays quiet.

## Architecture

### Character
A single authored SVG scene composed of real independent layers:
- shoulders and torso
- neck
- face
- back hair
- front hair
- eyes
- irises
- eyelids
- eyebrows
- mouth

These are DOM/SVG elements, so the browser can move the actual facial features.

### Motion
A centralized animation controller drives:
- gaze
- blink
- eyelids
- eyebrows
- mouth
- head
- breathing
- hair sway

Motion uses spring-like interpolation and irregular timing. There is no whole-image parallax.

### States
- idle
- attentive
- listening
- thinking
- speaking
- warm
- curious
- playful

State changes affect individual character channels.

### World
The room is deliberately understated:
- dark architectural background
- warm practical lamp
- soft window
- real depth layers
- sparse city light
- subtle atmosphere

No dashboard-like decoration. No constant particles. No large synthetic blobs.

### Interaction
- pointer position becomes eye/head attention
- typing becomes attentive
- sustained attention becomes curious
- microphone becomes listening
- browser voice becomes speaking
- leaving and returning creates continuity

### Conversation
The visual system is independent from the mind system.
Phase one works without API credits.
Phase two can connect server-side to a model without changing the character architecture.

### Accessibility
Reduced motion, keyboard focus, semantic controls, and readable contrast are mandatory.

### Performance
Use SVG transforms, opacity, CSS animations, and one requestAnimationFrame loop for attention interpolation. No WebGL unless a later phase proves it improves the actual character.

## Build order

1. Character silhouette and face.
2. Eye tracking and blinking.
3. Breathing, head and hair motion.
4. Expressive state transitions.
5. Cinematic room.
6. Interaction and voice.
7. Conversation mind.
8. Advanced embodiment only after the first six are visually excellent.

## Quality gate

Do not add an effect because it is technically possible.

The first test is always:

> Look at ALIVE for five seconds with no interaction. Does the character feel inhabited?

If not, improve the character instead of decorating the room.
