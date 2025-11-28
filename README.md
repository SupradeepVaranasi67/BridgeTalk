# 🌉 BridgeTalk - All-in-One Translator

BridgeTalk is a powerful and intuitive translation application designed to bridge communication gaps. It offers seamless translation capabilities across Text, Speech, and Images (OCR), making it the perfect companion for travelers and language learners.

## ✨ Features

### 📝 Text Translator
-   **Instant Translation**: Translate text between multiple languages instantly.
-   **Auto-Detection**: Automatically detects the source language.
-   **Favorites**: Save important translations for quick access.
-   **History**: Keep track of your translation history.

### 🗣️ Speech Translator
-   **Speech-to-Speech**: Speak in your native language and hear the translation in the target language.
-   **Conversation Mode**: Facilitate two-way conversations with ease.
-   **Indian Language Support**: Specialized support for Indian languages.

### 📷 OCR (Image) Translator
-   **Image Recognition**: Pick an image from your gallery or take a photo to recognize text.
-   **Instant Translation**: Translate recognized text immediately.
-   **Read Aloud**: Listen to the translated text with a single tap.

### 🧠 Recommendation System
-   **Smart Suggestions**: Get context-aware suggestions for quick translations.
-   **Travel Assistant**: Helpful phrases and questions for tourists based on location (State/Region).

### 🎨 Modern UI/UX
-   **Dark Mode Support**: Fully optimized for both Light and Dark modes.
-   **Responsive Design**: Works seamlessly on different screen sizes.
-   **Intuitive Navigation**: Easy-to-use tab-based navigation.

## 🛠️ Tech Stack

-   **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
-   **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
-   **Styling**: StyleSheet (Native) with Theming support
-   **APIs**:
    -   Google Cloud Translation API
    -   Google Cloud Vision API (for OCR)
-   **Libraries**:
    -   `expo-speech` (Text-to-Speech)
    -   `expo-image-picker` (Camera & Gallery)
    -   `@react-native-async-storage/async-storage` (Local Storage)
    -   `@react-native-picker/picker` (Dropdowns)

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (LTS version recommended)
-   [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
-   iOS Simulator (Mac) or Android Emulator (Windows/Mac/Linux) or a physical device with Expo Go app.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/SupradeepVaranasi67/BridgeTalk.git
    cd BridgeTalk
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure API Keys**
    -   Open `app/constants/Config.ts` (or create a `.env` file if configured).
    -   Add your Google Cloud API Key:
        ```typescript
        export default {
          GOOGLE_API_KEY: "YOUR_API_KEY_HERE",
        };
        ```

### Running the App

1.  **Start the development server**
    ```bash
    npx expo start
    ```

2.  **Run on Device/Emulator**
    -   **Android**: Press `a` in the terminal (requires Android Studio/Emulator).
    -   **iOS**: Press `i` in the terminal (requires Xcode/Simulator - Mac only).
    -   **Physical Device**: Scan the QR code with the Expo Go app (Android) or Camera app (iOS).

## 📱 Usage

1.  **Home Screen**: Choose between Text, Speech, or Image translation.
2.  **Text Mode**: Type text, select languages, and hit Translate.
3.  **Speech Mode**: Tap the microphone to speak.
4.  **OCR Mode**: Select an image or take a photo to extract and translate text. Use the volume icon to hear the result.
5.  **History/Favorites**: Access your past translations from the top-right menu.
