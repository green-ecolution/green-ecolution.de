import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import type { AdoptionData } from './adoptTreeData'

type TreeVariant = 'light' | 'middle' | 'dark'

interface AdoptTreeModalProps {
  data: AdoptionData | null
  onClose: () => void
}

const variantColors: Record<TreeVariant, { leaf: string; trunk: string }> = {
  light: {
    leaf: 'oklch(72.48% 0.147 115.72)',
    trunk: 'oklch(55% 0.05 80)',
  },
  middle: {
    leaf: 'oklch(60.12% 0.107 142.5)',
    trunk: 'oklch(45% 0.04 75)',
  },
  dark: {
    leaf: 'oklch(48.87% 0.089 145.23)',
    trunk: 'oklch(38% 0.03 70)',
  },
}

function TreeIllustration({ variant }: { variant: TreeVariant }) {
  const colors = variantColors[variant]
  return (
    <svg viewBox="0 0 120 140" className="w-24 h-28 drop-shadow-md" aria-hidden="true">
      <rect x="52" y="90" width="16" height="40" rx="4" fill={colors.trunk} />
      <circle cx="60" cy="50" r="36" fill={colors.leaf} opacity="0.85" />
      <circle cx="42" cy="62" r="24" fill={colors.leaf} opacity="0.7" />
      <circle cx="78" cy="62" r="24" fill={colors.leaf} opacity="0.7" />
      <circle cx="60" cy="35" r="22" fill={colors.leaf} opacity="0.95" />
      <circle cx="52" cy="38" r="12" fill="white" opacity="0.15" />
    </svg>
  )
}

function AdoptTreeModal({ data, onClose }: AdoptTreeModalProps) {
  const reducedMotion = useReducedMotion()
  const ref = useOutsideClick(onClose) as React.RefObject<HTMLDivElement>

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!data) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [data, handleKeyDown])

  if (!data) return null

  const colors = variantColors[data.treeVariant]
  const fullName = `${data.tree.name} die ${data.tree.species}`

  return createPortal(
    <div
      className={`
        fixed inset-0 z-[200] flex items-center justify-center p-4
        ${reducedMotion ? '' : 'animate-adopt-fade-in'}
      `}
    >
      <div className="absolute inset-0 bg-grey-900/60 backdrop-blur-xs" />

      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`Adoptionsurkunde für ${fullName}`}
        className={`
          relative w-full max-w-md overflow-hidden
          bg-green-light-100 rounded-3xl shadow-2xl
          ${reducedMotion ? '' : 'animate-adopt-scale-in'}
        `}
      >
        <div
          className="h-2 w-full"
          style={{
            background: `linear-gradient(90deg, ${variantColors.light.leaf}, ${variantColors.middle.leaf}, ${variantColors.dark.leaf})`,
          }}
        />

        <div className="absolute top-6 right-6 opacity-10 pointer-events-none select-none">
          <div
            className="w-20 h-20 rounded-full border-4 border-dashed flex items-center justify-center rotate-12"
            style={{ borderColor: colors.leaf }}
          >
            <span className="text-2xl font-lato font-black" style={{ color: colors.leaf }}>
              GE
            </span>
          </div>
        </div>

        <div className="px-6 pt-6 pb-2 sm:px-8 sm:pt-8">
          <p className="text-xs font-nunito-sans font-semibold uppercase tracking-widest text-green-dark-900/50 mb-1">
            Adoptionsurkunde
          </p>
          <p className="text-xxs font-nunito-sans text-green-dark-900/40 mb-5">
            Nr. {data.certNumber}
          </p>

          <div className="flex items-center gap-5 mb-5">
            <div
              className={`
                flex-shrink-0 rounded-2xl p-3
                bg-white/70
                ${reducedMotion ? '' : 'animate-adopt-tree-pop'}
              `}
            >
              <TreeIllustration variant={data.treeVariant} />
            </div>
            <div className="min-w-0">
              <h2 className="font-lato font-bold text-xl sm:text-2xl text-grey-900 leading-tight">
                {data.tree.emoji} {fullName}
              </h2>
              <p className="text-sm text-green-dark-900/60 font-nunito-sans mt-1">
                wartet in Flensburg auf dich
              </p>
            </div>
          </div>

          <div
            className="
              rounded-2xl bg-white/60 border border-green-light-900/10
              px-4 py-3.5 mb-5
            "
          >
            <p className="text-xs font-semibold text-green-dark-900/50 uppercase tracking-wide mb-1.5">
              Wusstest du?
            </p>
            <p className="text-sm text-grey-900/80 leading-relaxed font-nunito-sans">{data.fact}</p>
          </div>

          <p
            className="
              text-sm italic text-grey-900/60 font-nunito-sans text-center
              leading-relaxed mb-2
            "
          >
            „Danke, dass du an mich denkst! Mit Projekten wie Green Ecolution bekommen Stadtbäume
            wie ich endlich die Aufmerksamkeit, die wir verdienen."
          </p>
          <p className="text-right text-xs text-green-dark-900/40 font-nunito-sans mb-5">
            — {data.tree.name}, seit {data.plantedYear} in Flensburg
          </p>
        </div>

        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <button
            type="button"
            onClick={onClose}
            className="
              w-full py-3 rounded-xl font-semibold text-sm cursor-pointer
              bg-gradient-to-r from-green-dark-900 to-green-middle-900
              text-white shadow-lg shadow-green-dark-900/20
              transition-all duration-300
              hover:shadow-xl hover:shadow-green-dark-900/30 hover:-translate-y-0.5
              active:translate-y-0
            "
          >
            Danke, {data.tree.name}! 🌳
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default AdoptTreeModal
