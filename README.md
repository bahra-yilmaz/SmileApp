# SmileApp - Low-Code Mobile App

Welcome to SmileApp! This is a low-code mobile application project built with Expo, focusing on rapid iteration and a polished user experience.

## Project Philosophy

- Prioritize rapid iteration and UI-focused development.
- Maintain clean, modular, maintainable code with strong visual style.
- Favor simple solutions that deliver a polished mobile experience.

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd SmileApp
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the App

1.  **Start the development server:**
    ```bash
    npx expo start
    ```
2.  **Open the app:**
    - Scan the QR code with the Expo Go app (iOS or Android).
    - Or, run on a simulator/emulator:
        - Press `i` for iOS Simulator.
        - Press `a` for Android Emulator.

## Code Style and Structure

- **Modern JavaScript:** Concise, modern JavaScript using functional components.
- **No Class Components:** Avoid class-based components.
- **Descriptive Naming:** Use descriptive variable names (e.g., `isLoading`, `hasError`).
- **Modular Structure:** Organized into `components`, `subcomponents`, `helpers`, `theme`, `assets`, `constants`.
- **Named Exports:** Export components using named exports.
- **Hooks:** Utilize hooks and custom hooks for logic reuse.
- **Theming:** Rely on `colors.ts` or `theme.ts` for all styling values.

## Key Features & Technologies

- **UI & Styling:**
    - Expo built-in components / NativeBase.
    - Tailwind CSS (NativeWind) / styled-components (if needed).
    - Modern UI patterns: Glassmorphism with `expo-blur`.
    - Responsive layouts: Flexbox, `useWindowDimensions`.
    - Animations: `react-native-reanimated`, `moti`, `react-native-animatable` for micro-animations.
    - Accessibility: Designed for screen readers and scaling.
- **Mascot Integration:**
    - Modular, animated mascot component (Lottie, sprite sheets, or Reanimated).
    - Mascot reacts to user actions and app state.
    - Decoupled from main app logic (context/props).
- **Internationalization (i18n):**
    - Multi-language support with `expo-localization` and `i18next` / `react-native-i18n`.
    - All text wrapped with translation helpers (e.g., `t('login.title')`).
    - RTL support and text scaling.
- **State Management:**
    - `useState`, `useContext`, `useReducer`.
    - `react-query` for remote data (caching, background refresh).
    - Clean separation of UI and server state.
- **Backend Integration:**
    - Consumes an external API via an abstraction layer.
    - `expo-constants` for environment variables.
    - Robust loading and error handling for API requests.
    - Error logging (alerts, toasts, global error boundary).
- **Navigation:**
    - `react-navigation` (stack and tab navigators).
    - Deep linking and organized screen structure.
- **Safe Area Management:**
    - `SafeAreaProvider`, `SafeAreaView`, `SafeAreaScrollView`.
- **Testing & Error Handling:**
    - Early error catching and returns.
    - `try/catch` for async API calls.
    - Runtime validation (Zod or manual checks).
    - Unit tests (Jest) for key logic.
    - Snapshot tests for critical UI.
- **Performance:**
    - Memoization (`React.memo`, `useCallback`, `useMemo`).
    - Optimized images (WebP, `expo-image`).
    - Code-splitting and lazy loading.
    - Minimized re-renders.
- **Security:**
    - Input sanitization.
    - Secure storage: `react-native-encrypted-storage`.
    - HTTPS for API calls.
    - Adherence to [Expo Security Guidelines](https://docs.expo.dev/guides/security/).

## Theming

- All components consume color and spacing values from the theme.
- Supports light/dark mode and future custom themes.
- Glassmorphism implemented using blur layers, opacity, and background effects.
- Flexible `theme` system (context or styled-components).

## Publishing & Updates

- Follows Expo's managed workflow.
- `expo-updates` for OTA updates in production.
- Thorough testing on both iOS and Android.

## Available Scripts

In the project directory, you can run:

### `npm start` or `npx expo start`

Runs the app in development mode.

### `npm run android` or `npx expo run:android`

Runs the app on a connected Android device or emulator.

### `npm run ios` or `npx expo run:ios`

Runs the app on an iOS simulator or connected device.

### `npm run web` or `npx expo start --web`

Runs the app in a web browser.

### `npm test`

Launches the test runner in interactive watch mode.

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [NativeWind](https://www.nativewind.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Query](https://tanstack.com/query/v4/docs/react/overview)

## Contributing

Please read `CONTRIBUTING.md` for details on our code of conduct, and the process for submitting pull requests to us. (Note: `CONTRIBUTING.md` would need to be created if you want this section).

## License

This project is licensed under the MIT License - see the `LICENSE.md` file for details. (Note: `LICENSE.md` would need to be created).
