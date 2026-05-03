# Hideout Project Summary

## Overview
Hideout is a Next.js App Router project for a local gaming centre / lounge website. The UI is intentionally minimal, dark, and premium-feeling, with a strong orange accent used for calls to action and emphasis.

The current implementation focuses on a clean booking flow:
- A landing page that introduces the venue
- A dedicated slot booking page
- Reusable UI components for navigation, hero content, slot selection, and slot cards
- A lightweight interaction model with no heavy animation libraries or form complexity

## Design System
The visual language is consistent across the project and uses these core tokens:
- Background: `#0A0F18`
- Card surface: `#14181F`
- Border: `#2A2F38`
- Primary text: `#F5F1EA`
- Secondary text: `#A0A6AF`
- Accent: `#FF4500`

The interface uses:
- Tailwind CSS only for styling
- Subtle transitions and hover effects
- Minimal motion, mainly fade-in / fade-up entry animations and soft hover glow effects
- Centered layouts and generous spacing

## Routes

### `/`
Landing page for the gaming lounge.

Current content:
- Navbar at the top
- Hero section with a booking CTA
- About / experience section
- Games / setup section
- Features / experience section
- Pricing section
- Final CTA section
- Footer

The landing page is designed to be clean and professional while still feeling like a modern gaming lounge website.

### `/slots`
Dedicated slot selection page.

Current content:
- Navbar at the top
- Heading: `Choose your slot`
- SlotGrid booking interface beneath the heading

This route is the main entry point for testing or using the booking UI.

## Components

### `src/components/Navbar.tsx`
Responsive top navigation bar.

Features:
- Full-width dark navbar
- Bottom border and backdrop blur for a premium feel
- Logo image loaded from `/public/logo.png`
- Logo wrapped in a `Link` to `/`
- Navigation links centered
- Right-side login placeholder
- Uses `next/image` and `next/link`

### `src/components/Hero.tsx`
Landing page hero section.

Features:
- Full-height hero area with centered content
- Text: `Escape the ordinary` / `Enter the Hideout`
- Supporting text describing the gaming experience
- CTA button labeled `Book Now` linking to `/slots`
- Uses subtle entry styling and hover glow

### `src/components/SlotGrid.tsx`
Reusable booking slot grid.

Features:
- Internal sample slot list
- Booked slot markers for selected unavailable times
- Local state for a single selected slot
- Renders slot cards in a responsive grid
- Shows selected-slot feedback text
- Continue button logs the selected slot
- Helper text below the button explains the next step

Important behavior:
- Only one slot can be selected at a time
- Booked slots cannot be clicked
- Continue is disabled until a slot is selected

### `src/components/SlotCard.tsx`
Reusable slot card component.

Props:
- `time: string`
- `isBooked: boolean`
- `isSelected: boolean`
- `onClick: () => void`

Behavior and styling:
- Dark card surface with border and rounded corners
- Available state has hover border highlight and glow
- Selected state has stronger highlight and glow
- Booked state is visually muted and disabled
- Shows a status dot for availability/booked state
- Optional checkmark for selected cards

## Page Structure

### Landing Page Sections
The landing page currently contains these sections in order:
1. Navbar
2. Hero
3. About / Experience
4. Games / Setup
5. Experience / Features
6. Pricing
7. Final CTA
8. Footer

### Booking Flow
The booking flow is intentionally simple:
1. User lands on the homepage
2. User clicks `Book Now`
3. User is taken to `/slots`
4. User selects a slot from the grid
5. User clicks `Continue`
6. The selected slot is logged to the console

This keeps the current implementation lightweight while establishing the booking UI foundation.

## Styling and Animation
The project uses Tailwind CSS classes throughout and avoids external UI frameworks.

Animation approach:
- `fade-in` and `fade-up` utility classes are defined in `src/app/globals.css`
- These are lightweight keyframe animations for subtle section entrance
- Card hover effects use scale and glow rather than heavy motion

## Global Styles
`src/app/globals.css` provides the base visual system:
- Tailwind import
- Global color variables for the dark theme
- Base `body` font family set to Inter
- Global background and foreground colors
- Small custom keyframes for subtle animation utilities

## Assets
The project currently uses a logo asset:
- `public/logo.png`

This is rendered in the Navbar and links back to the homepage.

## Current State of the Booking UI
The UI now includes:
- Clean landing page presentation
- Dedicated slot selection page
- Responsive booking cards
- Clear selected state feedback
- Disabled / booked state handling
- A simple continuation action without a form

## Notes
- The project remains intentionally minimal and production-oriented in styling.
- The booking system is ready for the next step, such as a user details form or checkout flow.
- All components are built to be reusable and easy to extend.

## Relevant Files
- `src/app/page.tsx`
- `src/app/slots/page.tsx`
- `src/app/globals.css`
- `src/components/Navbar.tsx`
- `src/components/Hero.tsx`
- `src/components/SlotGrid.tsx`
- `src/components/SlotCard.tsx`
- `public/logo.png`

## Short Summary
Hideout is now a polished gaming lounge site with a premium dark UI, a content-rich landing page, and a dedicated slot booking flow built from reusable Tailwind-based components.
