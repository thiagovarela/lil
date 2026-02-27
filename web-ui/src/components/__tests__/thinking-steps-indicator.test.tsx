import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ThinkingStepsIndicator } from '../thinking-steps-indicator'
import type { DisplayMessage } from '@/stores/messages'

function makeThinkingOnlyMessage(
  overrides: Partial<DisplayMessage> = {},
): DisplayMessage {
  return {
    id: `msg-${Math.random()}`,
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    thinkingContent: 'Default thinking text',
    ...overrides,
  }
}

describe('ThinkingStepsIndicator', () => {
  it('renders a compact indicator for a single thinking step', () => {
    const messages = [
      makeThinkingOnlyMessage({ thinkingContent: 'Analyzing the problem' }),
    ]

    render(<ThinkingStepsIndicator messages={messages} />)

    expect(screen.getByText('💭 Thinking')).toBeInTheDocument()
    expect(screen.getByText('1 step')).toBeInTheDocument()
    expect(screen.getByText(/Analyzing the problem/)).toBeInTheDocument()
  })

  it('renders step count for multiple thinking steps', () => {
    const messages = [
      makeThinkingOnlyMessage({ thinkingContent: 'Step 1' }),
      makeThinkingOnlyMessage({ thinkingContent: 'Step 2' }),
      makeThinkingOnlyMessage({ thinkingContent: 'Step 3' }),
    ]

    render(<ThinkingStepsIndicator messages={messages} />)

    expect(screen.getByText('3 steps')).toBeInTheDocument()
  })

  it('shows the latest thinking text when collapsed', () => {
    const messages = [
      makeThinkingOnlyMessage({ thinkingContent: 'First step' }),
      makeThinkingOnlyMessage({ thinkingContent: 'Second step' }),
      makeThinkingOnlyMessage({ thinkingContent: 'Final step is the latest' }),
    ]

    render(<ThinkingStepsIndicator messages={messages} />)

    // Latest thinking text should be visible
    expect(screen.getByText(/Final step is the latest/)).toBeInTheDocument()
    // Earlier steps should not be visible when collapsed
    expect(screen.queryByText('1.')).not.toBeInTheDocument()
  })

  it('truncates long thinking text in collapsed state', () => {
    const longText = 'a'.repeat(100)
    const messages = [makeThinkingOnlyMessage({ thinkingContent: longText })]

    render(<ThinkingStepsIndicator messages={messages} />)

    const displayedText = screen.getByText(/a+…/)
    expect(displayedText.textContent).toHaveLength(51) // 50 chars + ellipsis
  })

  it('expands to show all thinking steps when clicked', async () => {
    const user = userEvent.setup()
    const messages = [
      makeThinkingOnlyMessage({ thinkingContent: 'First thought' }),
      makeThinkingOnlyMessage({ thinkingContent: 'Second thought' }),
      makeThinkingOnlyMessage({ thinkingContent: 'Third thought' }),
    ]

    render(<ThinkingStepsIndicator messages={messages} />)

    // Initially collapsed
    expect(screen.queryByText('1.')).not.toBeInTheDocument()

    // Click to expand
    const button = screen.getByRole('button')
    await user.click(button)

    // All steps should now be visible
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('First thought')).toBeInTheDocument()
    expect(screen.getByText('2.')).toBeInTheDocument()
    expect(screen.getByText('Second thought')).toBeInTheDocument()
    expect(screen.getByText('3.')).toBeInTheDocument()
    expect(screen.getByText('Third thought')).toBeInTheDocument()
  })

  it('collapses again when clicked in expanded state', async () => {
    const user = userEvent.setup()
    const messages = [
      makeThinkingOnlyMessage({ thinkingContent: 'First thought' }),
      makeThinkingOnlyMessage({ thinkingContent: 'Second thought' }),
    ]

    render(<ThinkingStepsIndicator messages={messages} />)

    const button = screen.getByRole('button')

    // Expand
    await user.click(button)
    expect(screen.getByText('1.')).toBeInTheDocument()

    // Collapse
    await user.click(button)
    expect(screen.queryByText('1.')).not.toBeInTheDocument()
  })

  it('shows spinner when message is actively thinking', () => {
    const messages = [
      makeThinkingOnlyMessage({
        thinkingContent: 'Currently thinking',
        isThinking: true,
      }),
    ]

    const { container } = render(<ThinkingStepsIndicator messages={messages} />)

    // Check for spinner (Loader2 with animate-spin)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('shows spinner when message is streaming', () => {
    const messages = [
      makeThinkingOnlyMessage({
        thinkingContent: 'Streaming thought',
        isStreaming: true,
      }),
    ]

    const { container } = render(<ThinkingStepsIndicator messages={messages} />)

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('does not show spinner when messages are complete', () => {
    const messages = [
      makeThinkingOnlyMessage({
        thinkingContent: 'Completed thought',
        isThinking: false,
        isStreaming: false,
      }),
    ]

    const { container } = render(<ThinkingStepsIndicator messages={messages} />)

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).not.toBeInTheDocument()
  })

  it('handles persistedThinkingContent for hydrated messages', () => {
    const messages = [
      makeThinkingOnlyMessage({
        thinkingContent: undefined,
        persistedThinkingContent: 'Persisted thought from history',
      }),
    ]

    render(<ThinkingStepsIndicator messages={messages} />)

    expect(
      screen.getByText(/Persisted thought from history/),
    ).toBeInTheDocument()
  })

  it('renders (empty) when thinking text is empty', async () => {
    const user = userEvent.setup()
    const messages = [
      makeThinkingOnlyMessage({ thinkingContent: '' }),
      makeThinkingOnlyMessage({ thinkingContent: 'Valid thought' }),
    ]

    render(<ThinkingStepsIndicator messages={messages} />)

    // Expand to see all steps
    await user.click(screen.getByRole('button'))

    expect(screen.getByText('(empty)')).toBeInTheDocument()
    expect(screen.getByText('Valid thought')).toBeInTheDocument()
  })

  it('starts collapsed by default', () => {
    const messages = [
      makeThinkingOnlyMessage({ thinkingContent: 'First' }),
      makeThinkingOnlyMessage({ thinkingContent: 'Second' }),
    ]

    render(<ThinkingStepsIndicator messages={messages} />)

    // Numbered list should not be visible
    expect(screen.queryByText('1.')).not.toBeInTheDocument()
    expect(screen.queryByText('2.')).not.toBeInTheDocument()
  })
})
