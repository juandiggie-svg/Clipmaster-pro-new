# ClipMaster Pro — Product Requirements Document

## Overview
ClipMaster Pro is a mobile-first React Native (Expo) app that helps barbers, stylists,
and beauty professionals automate their social media content using AI (Claude Sonnet 4.5).

## Target Users
Barbers, hair stylists, nail techs, lash techs, braiders, estheticians, tattoo artists.

## Key Features (11 AI Tools)
1. **Content Generator** — Daily posts, hooks, promos, weekly packs for IG + TikTok
2. **AI Photo Caption** — Upload haircut photo → AI writes the caption (vision)
3. **Before & After** — Upload before+after → AI writes transformation post (vision)
4. **7-Day Calendar** — Auto-plan a full week of posts
5. **TikTok Script Writer** — Word-for-word video scripts with hook, sound, hashtags
6. **Hashtag Strategy** — Mega/mid/niche/local tags by city + niche
7. **DM Reply Generator** — 3 reply variations (short, warm, hype)
8. **Performance Tracker** — Log posts → AI analyzes what works (MongoDB-backed)
9. **Pricing Coach** — Recommends prices based on city + experience
10. **Refer & Earn** — Pre-written share messages for IG/TikTok/SMS/Facebook
11. **How To Use Guide** — In-app accordion walkthrough

## Monetization
- 3 free generations (trial)
- Paywall locks further generations
- Stripe subscription $4.99/mo via external link (Linking.openURL)

## Tech Stack
- **Frontend**: Expo SDK 54, expo-router, AsyncStorage, expo-image-picker, expo-clipboard,
  expo-linear-gradient, @expo-google-fonts/bebas-neue + dm-sans
- **Backend**: FastAPI, motor (MongoDB), emergentintegrations (Claude Sonnet 4.5)
- **Storage**: AsyncStorage for profile + trial; MongoDB for tracked posts (per device_id)

## Architecture
```
/paywall          → Landing/paywall (Stripe CTA)
/onboarding       → 3-step setup (name → niche → city)
/hub              → 2-column bento grid of 11 tools
/tool/[id]        → Dynamic tool route (uses correct component)
```

## Design System
- Dark + Gold barbershop aesthetic
- Bebas Neue display, DM Sans body
- Color tokens in /app/frontend/lib/theme.ts
- Platform accent colors: Instagram pink #E1306C, TikTok cyan #00F2FE
