export interface Figure {
  prefix: string
  value: number
  separator: string
  suffix: string
}

const FIGURE = /^(\D*?)(\d{1,3}(?:([.,])\d{3})+|\d+)(.*)$/

export function parseFigure(text: string): Figure | null {
  const match = FIGURE.exec(text)
  if (!match) return null
  const [, prefix, digits, separator = '', suffix] = match
  return { prefix, value: Number(digits.replace(/[.,]/g, '')), separator, suffix }
}

export function formatFigure(figure: Figure, value: number): string {
  const digits = String(Math.round(value))
  const grouped = figure.separator
    ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, figure.separator)
    : digits
  return `${figure.prefix}${grouped}${figure.suffix}`
}
