## Cursor Cloud specific instructions

### Project Structure
- Single Expo/React Native app in `jetsetter-mobile/`.
- No backend code; all APIs (Firebase, Supabase, Amadeus, ARC Pay) are external cloud services pre-configured in `.env`.

### Running the App
- **Web mode (preferred for Cloud Agent testing):** `cd jetsetter-mobile && npx expo start --web --port 8081`
- The app serves on `http://localhost:8081`.
- Expo auto-loads `.env` variables on startup.

### Build Verification
- `cd jetsetter-mobile && npx expo export --platform web` — static web export.
- No separate build step needed for dev; the dev server handles bundling.

### Lint / Test
- No ESLint, Prettier, TypeScript, or test framework is configured.
- No `npm run lint` or `npm test` commands exist.
- Code is plain JavaScript (`.js` files).

### Known Issues
- The **Packages** tab crashes the Chrome renderer in web mode (pre-existing). All other tabs (Home, Flights, Hotels, My Trips) work fine.

### Key Gotchas
- `app.config.js` uses `require('dotenv').config()` — `dotenv` is a transitive dependency (installed via other packages), not listed in `package.json` directly.
- `app.json` and `app.config.js` both exist; Expo merges them, with `app.config.js` taking precedence.
- The `@react-native-google-signin/google-signin` plugin in `app.config.js` may log warnings in web mode — this is safe to ignore.
- Authentication is required to use the app. Use Firebase email/password sign-up from the Login screen, or test with an existing account.
- All API services in `src/services/` have `USE_MOCK_DATA = true` by default, so the app works without the Vercel backend.

### Ports
- Expo web dev server: 8081 (default)
- Metro bundler: 8081
