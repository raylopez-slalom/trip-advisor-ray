import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Constraint } from '@trip-advisor/shared'
import ConstraintChip from './ConstraintChip.js'

const CONSTRAINT: Constraint = {
  id: 'no-rental-car',
  text: 'no rental car',
  type: 'no-rental-car',
  source: 'user',
}

describe('ConstraintChip', () => {
  it('renders the constraint text', () => {
    render(<ConstraintChip constraint={CONSTRAINT} />)
    expect(screen.getByText('no rental car')).toBeInTheDocument()
  })

  it('has an accessible label that identifies it as a hard constraint', () => {
    render(<ConstraintChip constraint={CONSTRAINT} />)
    expect(screen.getByLabelText(/hard constraint: no rental car/i)).toBeInTheDocument()
  })

  it('applies red background styling', () => {
    render(<ConstraintChip constraint={CONSTRAINT} />)
    const chip = screen.getByLabelText(/hard constraint/i)
    expect(chip.className).toContain('bg-red-100')
    expect(chip.className).toContain('text-red-800')
  })

  it('includes an icon alongside the text (not color alone)', () => {
    render(<ConstraintChip constraint={CONSTRAINT} />)
    const chip = screen.getByLabelText(/hard constraint/i)
    expect(chip.querySelector('svg')).toBeTruthy()
  })

  it('renders different constraint text correctly', () => {
    const c: Constraint = { ...CONSTRAINT, id: 'fixed-duration', text: '5 days', type: 'fixed-duration' }
    render(<ConstraintChip constraint={c} />)
    expect(screen.getByText('5 days')).toBeInTheDocument()
  })
})
