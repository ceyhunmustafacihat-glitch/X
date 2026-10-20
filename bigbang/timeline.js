// Scene timing (seconds). Read by the animation and by render.mjs,
// so keep this a plain JSON object literal.
window.TIMELINE = {
  "duration": 60.0,
  "fps": 30,
  "scenes": [
    { "id": "hook",     "a": 0.0,  "b": 6.0 },
    { "id": "lemaitre", "a": 6.0,  "b": 14.5 },
    { "id": "steady",   "a": 14.5, "b": 24.0 },
    { "id": "radio",    "a": 24.0, "b": 36.0 },
    { "id": "intent",   "a": 36.0, "b": 44.5 },
    { "id": "cmb",      "a": 44.5, "b": 54.5 },
    { "id": "outro",    "a": 54.5, "b": 60.0 }
  ]
};
