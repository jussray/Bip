# Se'kret Bip 💜

A private emotional wellness and self-expression app built with React Native and Expo.

## Features

- **Anonymous Posting** - Community Circle for soft connections
- **Mood Tracking** - Track your emotional state over time
- **Journaling** - Private pages for your thoughts
- **Comfort Tools** - Breathing exercises and calm spaces
- **Voice Bips** - Record your thoughts aloud (30-60 seconds)
- **Cycle Tracking** - Private period calendar for menstruators
- **Teen & Parent Sides** - Separate spaces with guided communication tools
- **Multiple Personalities** - Choose your Se'kret (Soft, Rylane, Cloud, Night)
- **Theme Customization** - 5 beautiful theme packs

## Project Structure

```
sekret-bip/
├── app/                    # Expo Router screens
│   ├── _layout.tsx
│   └── index.tsx
├── components/             # Reusable UI components
│   ├── BottomNav.tsx
│   └── ...
├── screens/                # Screen components
│   ├── HomeScreen.tsx
│   ├── JournalScreen.tsx
│   └── ...
├── hooks/                  # Custom React hooks
│   └── useSekretState.ts
├── constants/              # App constants
│   ├── theme.ts
│   └── styles.ts
├── utils/                  # Utility functions
│   ├── api.ts
│   └── storage.ts
├── types/                  # TypeScript types
│   └── index.ts
├── .env.example            # Environment template
├── app.json                # Expo config
├── babel.config.js         # Babel config
├── metro.config.js         # Metro bundler config
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies
```

## Setup

### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
# Clone the repo
git clone https://github.com/jussray/Bip.git
cd Bip

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Update .env.local with your backend URL
# EXPO_PUBLIC_BACKEND_URL=http://YOUR_LOCAL_IP:8001
```

### Running Locally

```bash
# Start the dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Environment Variables

Create a `.env.local` file in the root directory:

```
EXPO_PUBLIC_BACKEND_URL=http://YOUR_LOCAL_IP:8001
EXPO_PUBLIC_APP_ENV=development
```

## Architecture

- **State Management**: AsyncStorage for persistence, React hooks for local state
- **Navigation**: Expo Router for file-based routing
- **Styling**: React Native StyleSheet with theme support
- **API**: Fetch for backend communication

## Tech Stack

- React Native 0.73
- Expo 51
- TypeScript
- Expo Router
- AsyncStorage

## License

Private project
