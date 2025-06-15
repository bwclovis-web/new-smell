# Pull Request Description Guidelines

## Structure & Format

### Title Format

Use clear, descriptive titles that follow conventional commit patterns:

- `feat: Add temperature calibration wizard for TRIOS instruments`
- `fix: Resolve SignalR connection timeout in experiment monitoring`
- `refactor: Simplify data visualization components using Chart.js patterns`
- `test: Add comprehensive Modal component test suite`
- `docs: Update Storybook stories for Button component variants`

### Description Template

```markdown
## What & Why

Brief description of what this PR does and why it's needed.

## Changes Made

- List specific changes made to the codebase
- Include file/component modifications
- Mention any new dependencies or removals

## Testing

- [ ] Unit tests added/updated (if applicable)
- [ ] Storybook stories created/updated (if applicable)
- [ ] Manual testing completed
- [ ] All existing tests pass

## Screenshots/Demo (if applicable)

Include screenshots for UI changes or GIFs for interactions.

## Breaking Changes

List any breaking changes and migration steps needed.

## Related Issues

Closes #123
Relates to #456
```

## AtomLab-Specific Guidelines

### Scientific Domain Context

- Mention impact on instrument control, calibration, or data analysis
- Include precision/accuracy implications for temperature or measurement changes
- Note any effects on real-time data streaming via SignalR
- Specify which instruments (TRIOS, temperature probes, etc.) are affected

### Component Architecture

- Specify Atomic Design level (Atoms/Molecules/Organisms/Containers)
- Include CVA variant changes or new styling patterns
- Mention accessibility improvements for scientific interfaces
- Note any changes to component generator templates

### Technical Implementation

- Highlight React Router v7.4 routing changes
- Mention Zustand store modifications or new state patterns
- Include React Query hook updates for data fetching
- Note Tailwind CSS v4.0 styling updates or new utility usage

## Code Quality Checklist

### Testing Requirements

- [ ] Unit tests maintain >90% coverage for modified components
- [ ] Integration tests cover user workflows (calibration, experiments)
- [ ] Visual regression tests updated in Storybook
- [ ] MSW mocks updated for API changes

### Documentation Updates

- [ ] Changelog.md updated with version and changes
- [ ] Component stories updated for new variants
- [ ] JSDoc comments added for complex scientific calculations
- [ ] README.md updated if setup/usage changes

### Performance Considerations

- [ ] Bundle size impact assessed (use `npm run build:analyze`)
- [ ] React optimization patterns applied (memo, useMemo, useCallback)
- [ ] Code splitting implemented for large features
- [ ] SignalR connection efficiency maintained

## Review Guidelines

### What Reviewers Should Check

- **Functionality**: Does it solve the stated problem correctly?
- **Scientific Accuracy**: Are measurement precision and calibration logic correct?
- **User Experience**: Is the interface intuitive for laboratory operators?
- **Code Quality**: Follows project patterns and style guidelines?
- **Testing**: Adequate test coverage and meaningful assertions?
- **Performance**: No unnecessary re-renders or memory leaks?
- **Accessibility**: Keyboard navigation and screen reader support?

### Common Patterns to Verify

- CVA variants follow established patterns
- TypeScript interfaces are properly typed
- Error boundaries handle scientific data errors
- Form validation uses Conform.js with Zod schemas
- Real-time updates don't overwhelm the UI

## Types of Changes

### Feature Development

```markdown
## New Feature: [Feature Name]

### Overview

Brief description of the new capability.

### Technical Implementation

- Components: List new/modified components
- State Management: Zustand stores or React Query hooks
- Styling: New CVA variants or Tailwind patterns
- Testing: Coverage strategy

### User Impact

How this improves the laboratory workflow.
```

### Bug Fixes

```markdown
## Bug Fix: [Issue Description]

### Problem

Describe the bug and its impact on users.

### Root Cause

Technical explanation of what was causing the issue.

### Solution

How the fix addresses the root cause.

### Prevention

Steps taken to prevent similar issues.
```

### Refactoring

```markdown
## Refactor: [Component/Feature Name]

### Motivation

Why this refactoring was needed.

### Changes

- Code structure improvements
- Performance optimizations
- Maintainability enhancements

### Impact

- Bundle size changes
- Performance improvements
- Developer experience improvements
```

## Emergency/Hotfix Guidelines

For critical production issues:

- Use `hotfix:` prefix in title
- Include severity level (Critical/High/Medium)
- Describe immediate user impact
- Explain why normal review process was bypassed
- Include rollback plan if needed

## Remember

Good PR descriptions save time for reviewers and provide valuable context for future developers. They should clearly communicate what was changed, why it was changed, and how it affects the system.
