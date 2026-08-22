# Seva

A local services marketplace app connecting customers with nearby service providers (electricians, plumbers, carpenters, painters, and more). Built with Expo + Supabase.

## Stack

- **App**: Expo (SDK 57) + expo-router, React Native, TypeScript
- **Backend**: Supabase — Postgres (with PostGIS for geospatial search) + Auth (phone OTP) + Storage (provider photos)
- **i18n**: react-i18next — English, Telugu, and Hindi all shipped, driven by `profiles.preferred_language` (switchable in Profile)

## Getting started

1. Install dependencies

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with your Supabase project's credentials:

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

3. Set up the database — in the Supabase SQL Editor, run the files under `supabase/` **in this order**:

   1. `schema.sql` — core tables + RLS
   2. `add_search_location.sql` — pinned search location support
   3. `add_provider_photo.sql` — provider listing photo column
   4. `storage_provider_photos.sql` — storage bucket + policies for provider photos
   5. `add_reviews.sql` — reviews/ratings table
   6. `seed_categories.sql` — category/subcategory catalog
   7. `translate_categories.sql` — Telugu/Hindi names for the seeded categories/subcategories
   8. `nearby_providers.sql` — geospatial nearest-provider search function (also returns photo/rating aggregates)
   9. `seed_dummy_providers.sql` — optional test data for local development

   PostGIS must be enabled on the project (Database > Extensions), and a phone-based SMS provider (e.g. Twilio) must be configured under Authentication > Providers > Phone for OTP login to work.

4. Start the app

   ```bash
   npx expo start
   ```

   The nearby-providers map view (Android) needs a real Google Maps API key to actually render tiles — Expo Go's own shared dev key is unreliable in practice (shows a blank map with a "For development purposes only" watermark rather than real tiles). To get it working:

   1. In Google Cloud Console: create/select a project, **enable billing** (required even for free-tier usage — without it you get the watermarked blank map), enable "Maps SDK for Android", create an API key.
   2. Put that key in `app.json` under the `react-native-maps` plugin config (`androidGoogleMapsApiKey`, currently empty).
   3. Build a custom dev client (`eas build --profile development --platform android`) and install that instead of Expo Go — **Expo Go ignores this config entirely**, since it's a fixed pre-built shell that never reads your project's native settings. Editing `app.json` alone will not fix the blank map in Expo Go.

   iOS uses Apple Maps by default — no key needed there, works in Expo Go as-is.

## Project structure

```
src/
  app/            expo-router screens (file-based routing)
  components/     shared UI components
  constants/      theme, category icon map
  hooks/          theme/color-scheme hooks
  lib/            supabase client, auth context, i18n, location helpers
  locales/        i18n translation files
supabase/         SQL schema, migrations, and seed data (see Getting started above)
```
