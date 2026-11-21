// sound.ts
// the three sound effects of the app, made with the web audio api
// there are no audio files: every sound is a few short tones made by oscillators,
// so the sounds are original, need no license, and cost no download
//
// what it gives you:
//   setSoundEnabled   switch all sounds on or off (off by default)
//   playClick         short click, for buttons
//   playLevelUp       rising four note jingle, for an optimal result
//   playHurt          low falling buzz, for an infeasible result
//
// how it works:
//   the switch and the audio context live in module variables, so any file can call
//   a play function without passing props around, and the page only has to call
//   setSoundEnabled when the player presses the header toggle
//   every play function does nothing while sound is off

/** settings for one tone, see {@link tone} */
interface ToneOptions {
  /** start pitch in hz */
  freq: number;
  /** seconds to wait before the tone starts, so tones can be chained into a melody (default: 0) */
  at?: number;
  /** length of the tone in seconds */
  duration: number;
  /** wave shape: "square" is the chunky 8 bit sound, "sawtooth" is buzzier (default: "square") */
  type?: OscillatorType;
  /** loudness from 0 to 1 (default: 0.12, kept low so the sounds are never harsh) */
  volume?: number;
  /** if set, the pitch slides from `freq` to this value during the tone, in hz */
  slideTo?: number;
}

// the switch, off by default
let enabled = false;

// the audio context is created on the first sound, not when the file loads
let context: AudioContext | null = null;

// the lowest gain the exponential ramp can reach, it cannot ramp to exactly 0
const SILENCE = 0.0001;

/**
 * gets the shared audio context, creating it on first use
 *
 * @returns the context, or `null` on the server or in a browser without web audio
 *
 * @remarks
 * browsers block audio until the player has clicked something, so a context made
 * before that starts as "suspended", `resume()` wakes it up, and it is called every time
 * because a tab that was in the background can suspend the context again
 * old safari only has the prefixed `webkitAudioContext`
 *
 * @example
 * ```ts
 * const ctx = getContext();
 * if (ctx) console.log(ctx.state); // "running"
 * ```
 */
function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }

  if (context.state === "suspended") void context.resume();
  return context;
}

/**
 * plays one tone: an oscillator that fades out, so it ends without a pop
 *
 * @param ctx - the audio context to play in
 * @param options - see {@link ToneOptions}
 *
 * @remarks
 * the loudness starts at `volume` and falls exponentially to almost nothing,
 * which gives the short plucked feel and avoids the click a sudden stop makes
 * the oscillator is stopped a little after the fade ends, so it is cleaned up
 * and does not keep running
 *
 * @example
 * ```ts
 * tone(ctx, { freq: 440, duration: 0.2 });
 * tone(ctx, { freq: 440, at: 0.2, duration: 0.2, slideTo: 220 });
 * ```
 */
function tone(ctx: AudioContext, { freq, at = 0, duration, type = "square", volume = 0.12, slideTo }: ToneOptions) {
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);

  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(SILENCE, start + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/**
 * runs a sound only when sound is on, and never lets audio problems break the app
 *
 * @param play - gets the audio context and plays tones in it
 *
 * @remarks
 * a sound is a nice extra, so any failure (no web audio, a blocked context) is ignored
 * instead of crashing a click handler or the solve flow
 */
function run(play: (ctx: AudioContext) => void) {
  if (!enabled) return;
  try {
    const ctx = getContext();
    if (ctx) play(ctx);
  } catch {
    // audio is optional, so there is nothing useful to do here
  }
}

/**
 * switches every sound on or off
 *
 * @param on - true to allow sounds, false to mute them
 *
 * @remarks
 * call it from the click that toggles the setting, so the audio context is created
 * and resumed inside a real user click, which the browser requires
 * the click sound is played by the page's document click listener, so turning sound
 * on gives one click as confirmation and turning it off is silent
 *
 * @example
 * ```ts
 * setSoundEnabled(true);
 * ```
 */
export function setSoundEnabled(on: boolean) {
  enabled = on;
}

/**
 * short button click: a quick falling blip
 *
 * @example
 * ```ts
 * playClick();
 * ```
 */
export function playClick() {
  run((ctx) => tone(ctx, { freq: 700, duration: 0.05, slideTo: 350, volume: 0.1 }));
}

/**
 * level-up jingle: four rising notes (c, e, g, c an octave up), for an optimal result
 *
 * @remarks
 * the notes are 0.09 seconds apart, and the last one rings a little longer to end the phrase
 *
 * @example
 * ```ts
 * playLevelUp();
 * ```
 */
export function playLevelUp() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // c5, e5, g5, c6
  run((ctx) =>
    notes.forEach((freq, i) =>
      tone(ctx, { freq, at: i * 0.09, duration: i === notes.length - 1 ? 0.3 : 0.12 }),
    ),
  );
}

/**
 * hurt sound: a low buzz that falls in pitch, for an infeasible result
 *
 * @remarks
 * two sawtooth tones a little apart in pitch beat against each other,
 * which makes the rough "ouch" feel
 *
 * @example
 * ```ts
 * playHurt();
 * ```
 */
export function playHurt() {
  run((ctx) => {
    tone(ctx, { freq: 220, duration: 0.28, type: "sawtooth", slideTo: 90, volume: 0.14 });
    tone(ctx, { freq: 233, duration: 0.28, type: "sawtooth", slideTo: 95, volume: 0.1 });
  });
}

// references:
// mdn, web audio api: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
// mdn, using the web audio api (oscillators and gain): https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API
// mdn, audiocontext: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
// mdn, autoplay policy for web audio: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy
// mdn, oscillatornode: https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode
// mdn, audioparam.exponentialrampto​valueattime: https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/exponentialRampToValueAtTime
// mdn, audiocontext.resume(): https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume
// typescript, optional chaining and nullish coalescing: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html
// typescript, interfaces: https://www.typescriptlang.org/docs/handbook/2/objects.html
// tsdoc standard: https://tsdoc.org
