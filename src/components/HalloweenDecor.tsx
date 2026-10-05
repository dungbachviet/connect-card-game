import { motion, useReducedMotion } from 'motion/react'

const SPOKES = 6
const RINGS = [22, 44, 68, 94, 122]
const WEB_SIZE = 130

function webPath(): string {
  const angles = Array.from({ length: SPOKES }, (_, i) => (Math.PI / 2) * (i / (SPOKES - 1)))
  const point = (r: number, a: number) => [r * Math.cos(a), r * Math.sin(a)] as const
  let d = ''
  for (const a of angles) {
    const [x, y] = point(WEB_SIZE, a)
    d += `M0 0L${x.toFixed(1)} ${y.toFixed(1)}`
  }
  for (const r of RINGS) {
    for (let i = 0; i < angles.length - 1; i++) {
      const [x1, y1] = point(r, angles[i])
      const [x2, y2] = point(r, angles[i + 1])
      const [cx, cy] = point(r * 0.82, (angles[i] + angles[i + 1]) / 2)
      d += `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
    }
  }
  return d
}

const WEB_D = webPath()

export function SpiderWeb({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${WEB_SIZE} ${WEB_SIZE}`}
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      fill="none"
      aria-hidden
    >
      <path d={WEB_D} stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  )
}

function Bat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 28" className={className} fill="currentColor" aria-hidden>
      <path d="M32 9c-1.3-2.6-2.6-3.6-3.4-3.6.4 1.2.3 2.3-.2 3.1C25 6.4 20 4 13 4c2.6 1.6 4 3.8 4.3 6.2C12.6 9.3 6.5 10.5 0 15.5c5.2-.6 9.3.4 11.6 2.6 1.6-1.4 4-2 6.4-1.2 1.6.5 2.6 1.8 3.1 3.2 1.9-1.6 4.7-2 6.8-.8 1.2.7 2 1.9 2.4 3.2.6.1 1.1.1 1.7.1s1.1 0 1.7-.1c.4-1.3 1.2-2.5 2.4-3.2 2.1-1.2 4.9-.8 6.8.8.5-1.4 1.5-2.7 3.1-3.2 2.4-.8 4.8-.2 6.4 1.2 2.3-2.2 6.4-3.2 11.6-2.6-6.5-5-12.6-6.2-17.3-5.3.3-2.4 1.7-4.6 4.3-6.2-7 0-12 2.4-15.4 4.5-.5-.8-.6-1.9-.2-3.1C34.6 5.4 33.3 6.4 32 9Z" />
    </svg>
  )
}

const BATS = [
  { top: '12%', size: 'w-10', duration: 18, delay: 0, drift: 40 },
  { top: '26%', size: 'w-6', duration: 24, delay: 6, drift: 60 },
  { top: '8%', size: 'w-7', duration: 21, delay: 11, drift: 30 },
  { top: '40%', size: 'w-5', duration: 28, delay: 3, drift: 50 },
]

export function HalloweenDecor() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Moon */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-100/90 opacity-60 shadow-[0_0_80px_30px_rgba(253,230,138,0.25)] sm:right-[8%] sm:top-[6%] sm:h-28 sm:w-28 sm:opacity-100">
        <div className="absolute left-[22%] top-[30%] h-3 w-3 rounded-full bg-amber-200/70" />
        <div className="absolute left-[55%] top-[55%] h-4 w-4 rounded-full bg-amber-200/60" />
        <div className="absolute left-[40%] top-[15%] h-2 w-2 rounded-full bg-amber-200/60" />
      </div>

      {/* Eerie glows */}
      <div className="absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-orange-600/15 blur-[110px]" />
      <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-purple-700/20 blur-[110px]" />

      {/* Corner webs */}
      <SpiderWeb className="absolute left-0 top-0 h-32 w-32 text-zinc-300/25 sm:h-44 sm:w-44" />
      <SpiderWeb className="absolute right-0 top-0 h-24 w-24 text-zinc-300/20 sm:h-36 sm:w-36" flip />

      {/* Dangling spider */}
      <motion.div
        className="absolute left-[18%] top-0 flex flex-col items-center"
        style={{ originY: 0 }}
        animate={reduceMotion ? undefined : { y: [0, 36, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="h-24 w-px bg-zinc-300/30 sm:h-32" />
        <span className="-mt-1 text-xl opacity-80">🕷️</span>
      </motion.div>

      {/* Bats */}
      {!reduceMotion &&
        BATS.map((bat, i) => (
          <motion.div
            key={i}
            className={`absolute ${bat.size} text-zinc-950/90 drop-shadow-[0_0_6px_rgba(251,146,60,0.35)]`}
            style={{ top: bat.top, left: 0 }}
            initial={{ x: '-15vw' }}
            animate={{ x: '115vw', y: [0, -bat.drift, bat.drift / 2, -bat.drift / 2, 0] }}
            transition={{
              x: { duration: bat.duration, delay: bat.delay, repeat: Infinity, ease: 'linear' },
              y: { duration: bat.duration / 2, delay: bat.delay, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <motion.div
              animate={{ scaleY: [1, 0.45, 1] }}
              transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Bat className="w-full text-zinc-950" />
            </motion.div>
          </motion.div>
        ))}

      {/* Ground fog + pumpkins */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-purple-950/50 via-purple-950/15 to-transparent" />
      <motion.span
        className="absolute bottom-3 left-4 text-3xl opacity-90 sm:text-4xl"
        animate={reduceMotion ? undefined : { rotate: [-4, 4, -4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        🎃
      </motion.span>
      <motion.span
        className="absolute bottom-4 right-5 text-2xl opacity-80 sm:text-3xl"
        animate={reduceMotion ? undefined : { y: [0, -8, 0], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        👻
      </motion.span>
    </div>
  )
}
