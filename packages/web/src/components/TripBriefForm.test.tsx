import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TripBriefForm from './TripBriefForm.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/departure city/i), 'Chicago')
  await user.type(screen.getByLabelText(/number of days/i), '5')
  await user.type(screen.getByPlaceholderText(/total amount/i), '2500')
  // Answer budget clarification
  await user.click(screen.getByRole('radio', { name: /yes/i }))
  // Select one interest
  await user.click(screen.getByRole('button', { name: /^food$/i }))
  // Select pace
  await user.click(screen.getByRole('button', { name: /moderate/i }))
}

// ─── Required field validation ────────────────────────────────────────────────

describe('form validation', () => {
  it('shows an error when departure city is missing', async () => {
    const user = userEvent.setup()
    render(<TripBriefForm />)
    await user.type(screen.getByLabelText(/number of days/i), '5')
    await user.type(screen.getByPlaceholderText(/total amount/i), '2500')
    await user.click(screen.getByRole('radio', { name: /yes/i }))
    await user.click(screen.getByRole('button', { name: /^food$/i }))
    await user.click(screen.getByRole('button', { name: /moderate/i }))
    await user.click(screen.getByRole('button', { name: /find destinations/i }))
    expect(await screen.findByText(/departure city is required/i)).toBeInTheDocument()
  })

  it('shows an error when no date or duration is provided', async () => {
    const user = userEvent.setup()
    render(<TripBriefForm />)
    await user.type(screen.getByLabelText(/departure city/i), 'Chicago')
    await user.type(screen.getByPlaceholderText(/total amount/i), '2500')
    await user.click(screen.getByRole('radio', { name: /yes/i }))
    await user.click(screen.getByRole('button', { name: /^food$/i }))
    await user.click(screen.getByRole('button', { name: /moderate/i }))
    await user.click(screen.getByRole('button', { name: /find destinations/i }))
    expect(await screen.findByText(/enter travel dates or a duration/i)).toBeInTheDocument()
  })

  it('shows an error when no interest is selected', async () => {
    const user = userEvent.setup()
    render(<TripBriefForm />)
    await user.type(screen.getByLabelText(/departure city/i), 'Chicago')
    await user.type(screen.getByLabelText(/number of days/i), '5')
    await user.type(screen.getByPlaceholderText(/total amount/i), '2500')
    await user.click(screen.getByRole('radio', { name: /yes/i }))
    await user.click(screen.getByRole('button', { name: /moderate/i }))
    await user.click(screen.getByRole('button', { name: /find destinations/i }))
    expect(await screen.findByText(/select at least one interest/i)).toBeInTheDocument()
  })

  it('shows an error when no pace is selected', async () => {
    const user = userEvent.setup()
    render(<TripBriefForm />)
    await user.type(screen.getByLabelText(/departure city/i), 'Chicago')
    await user.type(screen.getByLabelText(/number of days/i), '5')
    await user.type(screen.getByPlaceholderText(/total amount/i), '2500')
    await user.click(screen.getByRole('radio', { name: /yes/i }))
    await user.click(screen.getByRole('button', { name: /^food$/i }))
    await user.click(screen.getByRole('button', { name: /find destinations/i }))
    expect(await screen.findByText(/select a preferred pace/i)).toBeInTheDocument()
  })
})

// ─── Budget clarification (AC-1) ──────────────────────────────────────────────

describe('budget clarification', () => {
  it('shows the flights clarification prompt when a budget amount is entered', async () => {
    const user = userEvent.setup()
    render(<TripBriefForm />)
    await user.type(screen.getByPlaceholderText(/total amount/i), '2500')
    expect(screen.getByText(/does this budget include flights/i)).toBeInTheDocument()
  })

  it('does not show the clarification prompt before a budget amount is entered', () => {
    render(<TripBriefForm />)
    expect(screen.queryByText(/does this budget include flights/i)).not.toBeInTheDocument()
  })

  it('blocks submit when "Not sure" is selected — AC-1', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TripBriefForm onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText(/departure city/i), 'Chicago')
    await user.type(screen.getByLabelText(/number of days/i), '5')
    await user.type(screen.getByPlaceholderText(/total amount/i), '2500')
    await user.click(screen.getByRole('radio', { name: /not sure/i }))
    await user.click(screen.getByRole('button', { name: /^food$/i }))
    await user.click(screen.getByRole('button', { name: /moderate/i }))
    await user.click(screen.getByRole('button', { name: /find destinations/i }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/please clarify whether your budget includes flights/i)).toBeInTheDocument()
  })

  it('shows a warning when "Not sure" is chosen', async () => {
    const user = userEvent.setup()
    render(<TripBriefForm />)
    await user.type(screen.getByPlaceholderText(/total amount/i), '2500')
    await user.click(screen.getByRole('radio', { name: /not sure/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/please clarify whether flights are included/i)
  })

  it('allows submit when "Yes" is selected', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TripBriefForm onSubmit={onSubmit} />)
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /find destinations/i }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('allows submit when "No" is selected', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TripBriefForm onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText(/departure city/i), 'Chicago')
    await user.type(screen.getByLabelText(/number of days/i), '5')
    await user.type(screen.getByPlaceholderText(/total amount/i), '2500')
    await user.click(screen.getByRole('radio', { name: /^no$/i }))
    await user.click(screen.getByRole('button', { name: /^food$/i }))
    await user.click(screen.getByRole('button', { name: /moderate/i }))
    await user.click(screen.getByRole('button', { name: /find destinations/i }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })
})

// ─── Chip rendering ───────────────────────────────────────────────────────────

describe('chip rendering after submit', () => {
  it('renders constraint chips (red) after a valid submit', async () => {
    const user = userEvent.setup()
    render(<TripBriefForm />)
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /find destinations/i }))

    const summary = await screen.findByRole('region', { name: /trip summary/i })
    const chips = within(summary).getAllByLabelText(/hard constraint:/i)
    expect(chips.length).toBeGreaterThan(0)
    for (const chip of chips) {
      expect(chip.className).toContain('bg-red-100')
    }
  })

  it('renders preference chips (blue) after a valid submit', async () => {
    const user = userEvent.setup()
    render(<TripBriefForm />)
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /find destinations/i }))

    const summary = await screen.findByRole('region', { name: /trip summary/i })
    const chips = within(summary).getAllByLabelText(/^preference:/i)
    expect(chips.length).toBeGreaterThan(0)
    for (const chip of chips) {
      expect(chip.className).toContain('bg-blue-100')
    }
  })

  it('no red chip is mistakenly blue and vice versa', async () => {
    const user = userEvent.setup()
    render(<TripBriefForm />)
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /find destinations/i }))

    const summary = await screen.findByRole('region', { name: /trip summary/i })
    for (const chip of within(summary).getAllByLabelText(/hard constraint:/i)) {
      expect(chip.className).not.toContain('blue')
    }
    for (const chip of within(summary).getAllByLabelText(/^preference:/i)) {
      expect(chip.className).not.toContain('red')
    }
  })
})

// ─── Recalculation warning ────────────────────────────────────────────────────

describe('recalculation warning', () => {
  it('shows a recalculation warning when the user edits after submitting', async () => {
    const user = userEvent.setup()
    render(<TripBriefForm />)
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /find destinations/i }))
    await screen.findByRole('region', { name: /trip summary/i })

    // Edit a field after submission
    await user.type(screen.getByLabelText(/departure city/i), ' updated')
    expect(screen.getByRole('status')).toHaveTextContent(/changing this will update your destination options/i)
  })

  it('hides the chips and shows the warning until re-submitted', async () => {
    const user = userEvent.setup()
    render(<TripBriefForm />)
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /find destinations/i }))
    await screen.findByRole('region', { name: /trip summary/i })

    await user.type(screen.getByLabelText(/departure city/i), ' updated')
    expect(screen.queryByRole('region', { name: /trip summary/i })).not.toBeInTheDocument()
  })
})
