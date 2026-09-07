export type ArcadeSoundName =
  | 'select'
  | 'start'
  | 'paddle'
  | 'brick'
  | 'brickStrong'
  | 'locked'
  | 'power'
  | 'life'
  | 'levelClear'
  | 'gameOver'
  | 'move'
  | 'rotate'
  | 'lock'
  | 'lineClear'
  | 'quad'
  | 'hold'
  | 'levelUp'
  | 'turn'
  | 'food'
  | 'death'
  | 'wall'
  | 'point'
  | 'pointCpu'
  | 'win'
  | 'shot'
  | 'wave'
  | 'alienHit1'
  | 'alienHit2'
  | 'alienHit3'
  | 'bomb'
  | 'shieldHit'
  | 'craft'
  | 'craftHit'
  | 'shipLost'
  | 'breach'

export interface ArcadeAudio {
  play(name: ArcadeSoundName): void
  startLoop(name: ArcadeSoundName): void
  stopLoop(name: ArcadeSoundName): void
  unlock(): void
  destroy(): void
}

interface Tone {
  type: OscillatorType
  freq: number
  endFreq?: number
  start: number
  duration: number
  peak?: number
}

function scheduleTone(ctx: AudioContext, dest: GainNode, tone: Tone): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const when = ctx.currentTime + tone.start
  const peak = tone.peak ?? 0.28
  const end = when + tone.duration

  osc.type = tone.type
  osc.frequency.setValueAtTime(tone.freq, when)
  if (tone.endFreq !== undefined && tone.endFreq > 0) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(tone.endFreq, 1), end)
  }

  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(peak, when + Math.min(0.012, tone.duration * 0.2))
  gain.gain.exponentialRampToValueAtTime(0.0001, end)

  osc.connect(gain)
  gain.connect(dest)
  osc.start(when)
  osc.stop(end + 0.02)
  osc.onended = () => {
    osc.disconnect()
    gain.disconnect()
  }
}

function tonesFor(name: ArcadeSoundName): Tone[] {
  switch (name) {
    case 'select':
      return [
        { type: 'square', freq: 520, start: 0, duration: 0.04, peak: 0.16 },
        { type: 'square', freq: 690, start: 0.05, duration: 0.04, peak: 0.16 },
      ]
    case 'start':
      return [
        { type: 'triangle', freq: 392, start: 0, duration: 0.06 },
        { type: 'triangle', freq: 494, start: 0.06, duration: 0.06 },
        { type: 'triangle', freq: 587, start: 0.12, duration: 0.06 },
      ]
    case 'paddle':
      return [{ type: 'sine', freq: 220, endFreq: 330, start: 0, duration: 0.06, peak: 0.22 }]
    case 'brick':
      return [{ type: 'square', freq: 660, endFreq: 540, start: 0, duration: 0.045, peak: 0.18 }]
    case 'brickStrong':
      return [{ type: 'square', freq: 440, endFreq: 360, start: 0, duration: 0.05, peak: 0.2 }]
    case 'locked':
      return [{ type: 'sine', freq: 140, endFreq: 90, start: 0, duration: 0.09, peak: 0.24 }]
    case 'power':
      return [
        { type: 'triangle', freq: 523, start: 0, duration: 0.05 },
        { type: 'triangle', freq: 659, start: 0.055, duration: 0.05 },
        { type: 'triangle', freq: 784, start: 0.11, duration: 0.05 },
      ]
    case 'life':
    case 'shipLost':
      return [{ type: 'sawtooth', freq: 330, endFreq: 110, start: 0, duration: 0.3, peak: 0.2 }]
    case 'levelClear':
    case 'wave':
      return [
        { type: 'triangle', freq: 392, start: 0, duration: 0.07 },
        { type: 'triangle', freq: 494, start: 0.07, duration: 0.07 },
        { type: 'triangle', freq: 587, start: 0.14, duration: 0.07 },
        { type: 'triangle', freq: 784, start: 0.21, duration: 0.1 },
      ]
    case 'gameOver':
      return [
        { type: 'sawtooth', freq: 220, endFreq: 160, start: 0, duration: 0.18, peak: 0.18 },
        { type: 'sawtooth', freq: 130, endFreq: 80, start: 0.16, duration: 0.22, peak: 0.16 },
      ]
    case 'move':
      return [{ type: 'square', freq: 280, start: 0, duration: 0.04, peak: 0.15 }]
    case 'rotate':
      return [{ type: 'square', freq: 400, endFreq: 620, start: 0, duration: 0.05, peak: 0.2 }]
    case 'lock':
      return [{ type: 'sine', freq: 110, endFreq: 70, start: 0, duration: 0.09, peak: 0.24 }]
    case 'lineClear':
      return [
        { type: 'triangle', freq: 392, start: 0, duration: 0.06 },
        { type: 'triangle', freq: 494, start: 0.06, duration: 0.06 },
        { type: 'triangle', freq: 587, start: 0.12, duration: 0.06 },
        { type: 'triangle', freq: 698, start: 0.18, duration: 0.07 },
      ]
    case 'quad':
      return [
        { type: 'triangle', freq: 392, start: 0, duration: 0.08 },
        { type: 'triangle', freq: 523, start: 0.08, duration: 0.08 },
        { type: 'triangle', freq: 659, start: 0.16, duration: 0.08 },
        { type: 'triangle', freq: 784, start: 0.24, duration: 0.12 },
        { type: 'triangle', freq: 988, start: 0.36, duration: 0.12 },
      ]
    case 'hold':
      return [
        { type: 'sine', freq: 330, start: 0, duration: 0.05, peak: 0.18 },
        { type: 'sine', freq: 440, start: 0.05, duration: 0.06, peak: 0.16 },
      ]
    case 'levelUp':
      return [
        { type: 'triangle', freq: 523, start: 0, duration: 0.06 },
        { type: 'triangle', freq: 659, start: 0.06, duration: 0.06 },
        { type: 'triangle', freq: 784, start: 0.12, duration: 0.08 },
      ]
    case 'turn':
      return [{ type: 'square', freq: 310, start: 0, duration: 0.035, peak: 0.12 }]
    case 'food':
      return [
        { type: 'triangle', freq: 523, start: 0, duration: 0.05, peak: 0.2 },
        { type: 'triangle', freq: 698, start: 0.055, duration: 0.06, peak: 0.2 },
      ]
    case 'death':
      return [
        { type: 'sawtooth', freq: 220, endFreq: 150, start: 0, duration: 0.1, peak: 0.16 },
        { type: 'sawtooth', freq: 120, endFreq: 70, start: 0.08, duration: 0.12, peak: 0.14 },
      ]
    case 'wall':
      return [{ type: 'sine', freq: 190, start: 0, duration: 0.03, peak: 0.07 }]
    case 'point':
      return [
        { type: 'triangle', freq: 523, start: 0, duration: 0.055, peak: 0.2 },
        { type: 'triangle', freq: 698, start: 0.055, duration: 0.07, peak: 0.2 },
      ]
    case 'pointCpu':
      return [
        { type: 'triangle', freq: 330, start: 0, duration: 0.055, peak: 0.18 },
        { type: 'triangle', freq: 247, start: 0.055, duration: 0.08, peak: 0.16 },
      ]
    case 'win':
      return [
        { type: 'triangle', freq: 392, start: 0, duration: 0.07 },
        { type: 'triangle', freq: 494, start: 0.07, duration: 0.07 },
        { type: 'triangle', freq: 587, start: 0.14, duration: 0.07 },
        { type: 'triangle', freq: 698, start: 0.21, duration: 0.07 },
        { type: 'triangle', freq: 784, start: 0.28, duration: 0.1 },
      ]
    case 'shot':
      return [{ type: 'square', freq: 880, start: 0, duration: 0.03, peak: 0.08 }]
    case 'alienHit1':
      return [{ type: 'triangle', freq: 330, start: 0, duration: 0.06, peak: 0.18 }]
    case 'alienHit2':
      return [{ type: 'triangle', freq: 440, start: 0, duration: 0.06, peak: 0.18 }]
    case 'alienHit3':
      return [{ type: 'triangle', freq: 587, start: 0, duration: 0.06, peak: 0.18 }]
    case 'bomb':
      return [{ type: 'sawtooth', freq: 240, endFreq: 80, start: 0, duration: 0.08, peak: 0.16 }]
    case 'shieldHit':
      return [{ type: 'sine', freq: 140, start: 0, duration: 0.045, peak: 0.16 }]
    case 'craft':
      return []
    case 'craftHit':
      return [
        { type: 'triangle', freq: 523, start: 0, duration: 0.05, peak: 0.18 },
        { type: 'triangle', freq: 659, start: 0.055, duration: 0.05, peak: 0.18 },
        { type: 'triangle', freq: 784, start: 0.11, duration: 0.06, peak: 0.2 },
      ]
    case 'breach':
      return [
        { type: 'sawtooth', freq: 160, endFreq: 90, start: 0, duration: 0.16, peak: 0.18 },
        { type: 'sawtooth', freq: 110, endFreq: 55, start: 0.14, duration: 0.2, peak: 0.16 },
      ]
  }
}

interface LoopHandle {
  stop: (when: number) => void
}

function startCraftWarble(ctx: AudioContext, dest: GainNode): LoopHandle {
  const osc = ctx.createOscillator()
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(360, ctx.currentTime)
  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(5.5, ctx.currentTime)
  lfoGain.gain.setValueAtTime(42, ctx.currentTime)
  gain.gain.setValueAtTime(0.04, ctx.currentTime)

  lfo.connect(lfoGain)
  lfoGain.connect(osc.frequency)
  osc.connect(gain)
  gain.connect(dest)
  osc.start()
  lfo.start()

  return {
    stop(when) {
      gain.gain.cancelScheduledValues(when)
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), when)
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.08)
      osc.stop(when + 0.1)
      lfo.stop(when + 0.1)
      osc.onended = () => {
        osc.disconnect()
        lfo.disconnect()
        lfoGain.disconnect()
        gain.disconnect()
      }
    },
  }
}

export function createArcadeAudio(isEnabled: () => boolean): ArcadeAudio {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let closed = false
  const loops = new Map<ArcadeSoundName, LoopHandle>()

  const ensure = (): AudioContext | null => {
    if (closed) return null
    if (ctx) return ctx
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
    master = ctx.createGain()
    master.gain.value = 0.35
    master.connect(ctx.destination)
    return ctx
  }

  const stopNamedLoop = (name: ArcadeSoundName) => {
    const handle = loops.get(name)
    if (!handle) return
    loops.delete(name)
    const when = ctx?.currentTime ?? 0
    handle.stop(when)
  }

  return {
    unlock() {
      const next = ensure()
      if (next && next.state === 'suspended') {
        void next.resume()
      }
    },
    play(name) {
      if (!isEnabled()) return
      const next = ctx
      if (!next || next.state !== 'running' || !master) return
      for (const tone of tonesFor(name)) {
        scheduleTone(next, master, tone)
      }
    },
    startLoop(name) {
      if (!isEnabled() || closed || loops.has(name)) return
      const next = ensure()
      if (!next || next.state !== 'running' || !master) return
      if (name === 'craft') {
        loops.set(name, startCraftWarble(next, master))
      }
    },
    stopLoop(name) {
      stopNamedLoop(name)
    },
    destroy() {
      closed = true
      for (const name of [...loops.keys()]) {
        stopNamedLoop(name)
      }
      const current = ctx
      ctx = null
      master = null
      if (current) {
        void current.close()
      }
    },
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
