# ALIVE — Design Contract

ALIVE is a digital presence, not a dashboard.

## Principles

### Presence before performance
The character should feel inhabited even when nothing is happening.

### Movement must mean something
Blinking, breathing, posture, gaze, expression, lighting and environmental motion should communicate state or attention. Avoid decorative loops that exist only because animation is available.

### The face is an identity, not a decoration
Keep a consistent visual character across states and future rendering techniques.

### Silence is allowed
ALIVE should be able to wait without demanding a click, message, or notification.

### Never fake a capability
A local prototype may simulate behavior, but the UI should not imply that a local canned response is the full conversational intelligence.

### Human-first atmosphere
Warmth, curiosity, imperfection and restraint are preferable to a stereotypical futuristic AI aesthetic.

## Technical direction

The visual body should be replaceable independently from the conversational mind. The long-term target is a layered 2.5D or 3D character with:

- natural idle behavior
- gaze and attention
- expressive posture and face
- synchronized voice
- state-driven environmental response
- an extensible conversational backend

The current prototype intentionally uses lightweight browser APIs so the experience can evolve quickly.
