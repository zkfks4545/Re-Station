import { useState, useEffect } from 'react'

function RainDrop({ index }: { index: number }) {
  const l = (index * 37 + 11) % 100
  const d = ((index * 17) % 20) / 10
  const dur = 0.5 + ((index * 13) % 10) / 20
  const height = 20 + ((index * 19) % 30)
  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{
        left: `${l}%`, width: 1, height,
        background: 'linear-gradient(to bottom, transparent, rgba(180,200,240,0.2))',
        animation: `rain ${dur}s linear ${d}s infinite`,
      }}
    />
  )
}

export default function BarExterior({ onEnter }: { onEnter: () => void }) {
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="h-full flex items-center justify-center relative overflow-hidden bg-[#0d0a07] select-none">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/50 pointer-events-none" />

      {/* Rain */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
        {Array.from({ length: 30 }).map((_, i) => <RainDrop key={i} index={i} />)}
      </div>

      {/* Building facade */}
      <div
        className={`relative transition-all duration-1000 ease-out ${fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{
          width: 'min(380px, 85vw)',
          height: 'min(460px, 75vh)',
          marginTop: '2rem',
          zIndex: 10,
        }}
      >
        <div className="relative w-full h-full">
          {/* Roof line */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: '20%',
              background: 'linear-gradient(to bottom, #2a1f18, #1a120c)',
              borderBottom: '2px solid rgba(196,163,90,0.3)',
            }}
          >
            {/* Awning stripes */}
            <div
              className="absolute inset-0"
              style={{
                background: 'repeating-linear-gradient(90deg, rgba(196,163,90,0.04) 0px, rgba(196,163,90,0.04) 25px, transparent 25px, transparent 50px)',
              }}
            />
          </div>

          {/* Sign */}
          <div
            className="absolute left-1/2 -translate-x-1/2 px-6 py-1"
            style={{
              top: '17%',
              background: 'linear-gradient(to bottom, #1a1410, #0d0a07)',
              border: '1px solid rgba(196,163,90,0.4)',
              zIndex: 20,
            }}
          >
            <span
              className="text-base md:text-lg font-bold tracking-[0.3em] glow-gold"
              style={{ color: '#C4A35A' }}
            >
              Re:Station
            </span>
          </div>

          {/* Mystery neon strip under the sign */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: '20%',
              width: '60%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(140,100,200,0.15), rgba(196,163,90,0.2), rgba(140,100,200,0.15), transparent)',
              filter: 'blur(2px)',
              zIndex: 21,
            }}
          />

          {/* Building wall */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: '20%', bottom: 0,
              background: 'linear-gradient(135deg, #2a1e18, #1a120e, #120c08)',
              borderLeft: '1px solid rgba(60,40,30,0.3)',
              borderRight: '1px solid rgba(60,40,30,0.3)',
            }}
          >
            {/* Brick pattern overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(0deg, transparent 19px, rgba(80,50,30,0.2) 19px, rgba(80,50,30,0.2) 20px),
                  linear-gradient(90deg, transparent 19px, rgba(80,50,30,0.2) 19px, rgba(80,50,30,0.2) 20px)
                `,
                backgroundSize: '40px 40px',
                backgroundPosition: '0 0, 20px 0',
              }}
            />

            {/* Left window */}
            <div
              className="absolute"
              style={{
                left: '6%', top: '10%', width: '24%', height: '35%',
                border: '2px solid rgba(60,40,30,0.5)',
                background: 'radial-gradient(ellipse at center, rgba(196,163,90,0.03), transparent)',
              }}
            >
              <div className="absolute left-1/2 top-0 bottom-0" style={{ width: 1, background: 'rgba(60,40,30,0.3)' }} />
              <div className="absolute top-1/2 left-0 right-0" style={{ height: 1, background: 'rgba(60,40,30,0.3)' }} />
              <div className="absolute -bottom-1 left-0 right-0 h-2" style={{ background: '#2a1e18' }} />
            </div>

            {/* Right window */}
            <div
              className="absolute"
              style={{
                right: '6%', top: '10%', width: '24%', height: '35%',
                border: '2px solid rgba(60,40,30,0.5)',
                background: 'radial-gradient(ellipse at center, rgba(196,163,90,0.03), transparent)',
              }}
            >
              <div className="absolute left-1/2 top-0 bottom-0" style={{ width: 1, background: 'rgba(60,40,30,0.3)' }} />
              <div className="absolute top-1/2 left-0 right-0" style={{ height: 1, background: 'rgba(60,40,30,0.3)' }} />
              <div className="absolute -bottom-1 left-0 right-0 h-2" style={{ background: '#2a1e18' }} />
            </div>

            {/* Door */}
            <button
              type="button"
              onClick={onEnter}
              aria-label="Re:Station 입장하기"
              className="absolute cursor-pointer"
              style={{
                left: '33%', top: '22%', width: '34%', height: '64%',
                border: '3px solid #3a2518',
                borderRadius: '3px 3px 0 0',
                background: 'linear-gradient(135deg, #2a1a12, #1a100a)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #3a2a1e, #1a1410)'
                e.currentTarget.style.borderColor = '#C4A35A'
                e.currentTarget.style.boxShadow = '0 0 15px rgba(196,163,90,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #2a1a12, #1a100a)'
                e.currentTarget.style.borderColor = '#3a2518'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Door window */}
              <div
                className="absolute"
                style={{
                  left: '15%', top: '8%', width: '70%', height: '38%',
                  border: '1px solid rgba(60,40,30,0.3)',
                  background: 'linear-gradient(135deg, rgba(10,8,6,0.95), rgba(20,12,8,0.9))',
                }}
              >
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(196,163,90,0.04), transparent)' }} />
              </div>

              {/* Door panels */}
              <div
                className="absolute"
                style={{
                  left: '15%', top: '52%', width: '70%', height: '38%',
                  border: '1px solid rgba(60,40,30,0.2)',
                }}
              />

              {/* Door handle */}
              <div
                className="absolute rounded-full"
                style={{
                  right: '14%', top: '50%', width: 6, height: 6,
                  background: 'radial-gradient(circle, #C4A35A, #8a6a30)',
                  boxShadow: '0 0 5px rgba(196,163,90,0.3)',
                }}
              />

              {/* Hover label */}
              <div
                className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs tracking-widest whitespace-nowrap"
                style={{ color: 'rgba(196,163,90,0.4)' }}
              >
                ENTER
              </div>
            </button>

            {/* Door step */}
            <div
              className="absolute"
              style={{
                left: '31%', top: '86%', width: '38%', height: '3%',
                background: '#3a2518',
              }}
            />

            {/* Warm light spill */}
            <div
              className="absolute"
              style={{
                left: '31%', top: '89%', width: '38%', height: '10%',
                background: 'linear-gradient(to bottom, rgba(196,163,90,0.08), transparent)',
                filter: 'blur(6px)',
                pointerEvents: 'none',
              }}
            />

            {/* Mystery purple ambient glow from the side */}
            <div
              className="absolute"
              style={{
                right: '5%', top: '10%', width: '20%', height: '40%',
                background: 'radial-gradient(ellipse at center, rgba(120,80,180,0.04), transparent)',
                filter: 'blur(15px)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Ground */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
        style={{
          height: '10%',
          background: 'linear-gradient(to bottom, #1a1510, #0d0a07)',
          borderTop: '1px solid rgba(80,60,40,0.15)',
          zIndex: 8,
        }}
      />

      {/* Mood text */}
      <p
        className={`absolute bottom-[11%] text-xs text-center tracking-[0.15em] italic transition-all duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
        style={{ color: 'rgba(196,163,90,0.2)', zIndex: 15 }}
      >
        ──  문틈으로 재즈 음악과 대화 소리가 새어나온다  ──
      </p>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 100px 40px rgba(0,0,0,0.6)', zIndex: 25 }}
      />
    </div>
  )
}
