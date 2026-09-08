# Accessibility and Responsive Behavior

## Accessibility Baseline

Target WCAG 2.2 AA for the application UI where practical.

### Required
- keyboard operability for all main actions;
- visible focus state;
- correct button/link semantics;
- labels associated with inputs;
- error messages programmatically associated with fields;
- accessible dialogs/sheets with focus trapping and return focus;
- table headers and captions/labels for complex tables;
- tooltip content available through keyboard/focus, not hover only;
- recommendation text/icons in addition to color;
- score/confidence labels in addition to radial/progress visuals;
- reduced-motion preference respected for nonessential animations.

## Responsive Breakpoints

Follow the reference dashboard/Tailwind breakpoints. Design intent:

### Large Desktop
- expanded or collapsible sidebar;
- 12-column analytics grid where useful;
- side-by-side analysis panels.

### Laptop/Desktop
- collapsed sidebar supported;
- most analytics remain 2–4 columns;
- evidence/score explanation in side sheet.

### Tablet
- sidebar drawer;
- analytical grids reduce columns;
- tables prioritize core columns and allow horizontal scroll/details.

### Mobile
- one primary column;
- sticky bottom decision actions allowed on Idea Detail;
- tabs may become scrollable segmented list or dropdown if too wide;
- avoid rendering large comparison matrices as unreadable mini-tables; convert rows into cards or detail sheets.

## Prototype Device Frames

Internal mobile prototype preview supports at minimum:
- generic iPhone portrait frame;
- generic Android phone portrait frame;
- responsive viewport without device chrome.

The device frame is presentation only; layout requirements are encoded per screen in the prototype spec.
