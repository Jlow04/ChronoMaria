# Hover Tooltip Feature Guide

## Overview
A reusable tooltip/quick guide system has been added to provide helpful context when hovering over important buttons throughout the application.

## Components Created

### 1. **Tooltip Component** (`src/components/Tooltip.jsx`)
A simple, reusable React component that displays helpful text on hover.

**Props:**
- `children` - The element to wrap (usually a button)
- `text` - The tooltip text to display
- `position` - Tooltip position relative to element: `'top'`, `'bottom'`, `'left'`, or `'right'` (default: `'top'`)

### 2. **Tooltip Styles** (`src/components/Tooltip.css`)
Professional styling with:
- Smooth fade-in animation
- Arrow pointer indicator
- Dark background with light text
- Multiple position variants
- Responsive design for mobile

## Usage Examples

### Basic Usage
```jsx
import Tooltip from '../components/Tooltip';

<Tooltip text="Click to add a new faculty member" position="bottom">
  <button className="btn btn-primary" onClick={handleAdd}>
    Add Faculty
  </button>
</Tooltip>
```

### In Different Positions
```jsx
// Tooltip above the button
<Tooltip text="Edit this item" position="top">
  <button>Edit</button>
</Tooltip>

// Tooltip to the left
<Tooltip text="Remove this item" position="left">
  <button>Delete</button>
</Tooltip>

// Tooltip to the right
<Tooltip text="View details" position="right">
  <button>Details</button>
</Tooltip>
```

## Pages Updated with Tooltips

### Schedule Page
- ✅ "Generate Schedule" - Explains the genetic algorithm
- ✅ "Print Generated List" - Explains the print/export functionality

### Faculty Page
- ✅ "Add Faculty" - Create new faculty records
- ✅ "Edit" - Modify faculty information
- ✅ "Delete" - Remove faculty members

### Subjects Page
- ✅ "Add Subject" - Create new courses
- ✅ "Edit" - Modify subject details
- ✅ "Delete" - Remove subjects

### Rooms Page
- ✅ "Add Room" - Add new classroom/facility
- ✅ "Edit" - Modify room information
- ✅ "Delete" - Remove rooms

## How to Add Tooltips to Other Buttons

1. **Import the Tooltip component** at the top of your page file:
```jsx
import Tooltip from '../components/Tooltip';
```

2. **Wrap your button** with the Tooltip component:
```jsx
<Tooltip text="Your helpful text here" position="bottom">
  <button className="btn btn-primary" onClick={handleClick}>
    Button Label
  </button>
</Tooltip>
```

3. **Choose the best position** based on button location:
   - Use `"bottom"` for buttons in top navigation or headers
   - Use `"left"` for buttons in far-right table columns
   - Use `"right"` for buttons in far-left areas
   - Use `"top"` for buttons near bottom of screen

## Tooltip Text Guidelines

Write clear, concise tooltip text that:
- ✅ Explains what the button does
- ✅ Describes the action impact
- ✅ Uses simple, non-technical language
- ✅ Keeps to one sentence when possible
- ❌ Avoids jargon
- ❌ Avoids repetition of button label

### Good Tooltip Examples
- "Run the genetic algorithm to create an optimal faculty schedule"
- "Create a new faculty member record"
- "Edit subject details"
- "Remove this item from the system"

### Poor Tooltip Examples
- "Click here" (obvious)
- "Edit" (just repeats button label)
- "This allows you to input data about faculty members" (too wordy)

## Styling Customization

To customize tooltip appearance, edit `src/components/Tooltip.css`:

- **Colors:** Modify background colors in `.tooltip` class
- **Animation:** Adjust `@keyframes slideIn`
- **Arrow:** Modify `.tooltip::before` styling
- **Size:** Change padding, font-size, and spacing

## Accessibility Notes

The tooltip component includes:
- Keyboard support (shows on focus/blur)
- Semantic HTML structure
- Proper z-index layering
- Mobile-friendly responsive design

## Future Enhancements

Potential improvements:
- Delay before showing tooltip (prevent info overload)
- Tooltip dismiss button
- Dark/light theme variants
- Support for HTML content in tooltips
- Tooltip hotkeys to show/hide all at once
- A11y improvements (ARIA labels)

---

**Need to add tooltips elsewhere?** Follow the "How to Add Tooltips to Other Buttons" section above!
