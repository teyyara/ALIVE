export const STATES = Object.freeze({
  idle: {
    label: 'Here',
    sublabel: 'Nothing is required.',
    line: '…'
  },
  listening: {
    label: 'Listening',
    sublabel: 'Take your time.',
    line: 'I’m here.'
  },
  curious: {
    label: 'Curious',
    sublabel: 'Something caught my attention.',
    line: 'Tell me more.'
  },
  thinking: {
    label: 'Thinking',
    sublabel: 'Let me sit with that.',
    line: '…'
  },
  warm: {
    label: 'Warm',
    sublabel: 'A little closer.',
    line: 'I like being here.'
  },
  playful: {
    label: 'Playful',
    sublabel: 'There is room for nonsense too.',
    line: 'Okay. I’m listening. 😌'
  },
  speaking: {
    label: 'Speaking',
    sublabel: 'Voice is active.',
    line: 'Give me a second…'
  }
});

export function stateName(name) {
  return STATES[name] ? name : 'idle';
}
