import type { Constraint, ConstraintType, Preference, TripBrief } from '@trip-advisor/shared'

export interface ClassificationResult {
  constraints: Constraint[]
  preferences: Preference[]
}

function transportConstraintType(text: string): ConstraintType {
  const lower = text.toLowerCase()
  if (lower.includes('no rental car') || lower.includes('no car')) return 'no-rental-car'
  if (lower.includes('public transit') || lower.includes('transit only')) return 'public-transit-only'
  if (lower.includes('no long flight') || lower.includes('no long-haul')) return 'no-long-flights'
  return 'other'
}

export function classifyTripBrief(brief: TripBrief): ClassificationResult {
  const constraints: Constraint[] = []
  const preferences: Preference[] = []

  // Fixed duration → hard constraint
  if (brief.durationDays !== null) {
    constraints.push({
      id: 'fixed-duration',
      text: `${brief.durationDays} day${brief.durationDays === 1 ? '' : 's'}`,
      type: 'fixed-duration',
      source: 'user',
    })
  }

  // Budget ceiling → hard constraint only once the user has clarified inclusion
  if (brief.budget.clarified) {
    const includesList = brief.budget.includes.join(', ')
    constraints.push({
      id: 'budget-ceiling',
      text: `${brief.budget.currency} ${brief.budget.amount.toLocaleString()} total (includes ${includesList || 'unspecified'})`,
      type: 'budget-ceiling',
      source: 'user',
    })
  }

  // Transportation restrictions → constraints
  brief.transportationConstraints.forEach((text, i) => {
    constraints.push({
      id: `transport-${i}`,
      text,
      type: transportConstraintType(text),
      source: 'user',
    })
  })

  // Accessibility needs → hard constraint (required accommodation, not a preference)
  if (brief.accessibilityNeeds) {
    constraints.push({
      id: 'accessibility',
      text: brief.accessibilityNeeds,
      type: 'accessibility',
      source: 'user',
    })
  }

  // Interests → activity preferences
  for (const interest of brief.interests) {
    preferences.push({
      id: `interest-${interest}`,
      text: interest.replace(/-/g, ' '),
      category: 'activity',
    })
  }

  // Pace → pace preference
  preferences.push({
    id: 'pace',
    text: `${brief.pace} pace`,
    category: 'pace',
  })

  // Dietary preferences → soft preference
  if (brief.dietaryPreferences) {
    preferences.push({
      id: 'dietary',
      text: brief.dietaryPreferences,
      category: 'other',
    })
  }

  return { constraints, preferences }
}
