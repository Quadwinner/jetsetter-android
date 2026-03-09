## Cursor Cloud specific instructions

### Project layout
Single React Native / Expo app in `jetsetter-mobile/`. No local backend — all APIs are external cloud services (Firebase, Supabase, Amadeus, ARC Pay). See `jetsetter-mobile/CLAUDE.md` for full architecture and dev commands.

### Running the app
```bash
cd jetsetter-mobile
npx expo start --web --port 8081   # web mode (works in cloud VM)
```
The `.env` file in `jetsetter-mobile/` has all required credentials pre-configured. Expo auto-loads it.

### Web mode caveat
The original `src/services/firebase.js` uses `getReactNativePersistence(AsyncStorage)` which crashes on web. A platform check (`Platform.OS === 'web'`) was added to use `getAuth(app)` on web instead. If this fix is reverted, the web dev server will show a blank page with a JS error about `getReactNativePersistence`.

### Lint / Test / Build
- No ESLint, TypeScript config, or test framework is set up in this repo. The README mentions `npm run lint` and `npm test` but those scripts are **not defined** in `package.json`.
- Build verification: `npx expo export --platform web` bundles successfully and confirms no compile errors.

### Booking services mock mode
All booking services (`flightService.js`, `hotelService.js`, `cruiseService.js`, `packageService.js`) have `USE_MOCK_DATA = true`. Payment uses `processMockPayment` by default. See `CLAUDE.md` for details on switching to real APIs.
