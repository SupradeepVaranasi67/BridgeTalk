import * as Speech from "expo-speech";

import { Platform } from "react-native";

const LANGUAGE_LOCALE_MAP: { [key: string]: string } = {
    // Indian Languages
    'ta': 'ta-IN', // Tamil
    'te': 'te-IN', // Telugu
    'kn': 'kn-IN', // Kannada
    'mr': 'mr-IN', // Marathi
    'bn': 'bn-IN', // Bengali
    'gu': 'gu-IN', // Gujarati
    'ml': 'ml-IN', // Malayalam
    'ur': 'ur-IN', // Urdu
    'pa': 'pa-IN', // Punjabi
    'hi': 'hi-IN', // Hindi (often works without, but good to be explicit)
};

const getLocaleForLanguage = (languageCode: string): string => {
    // Check if we have a direct mapping for the code (e.g., 'ta')
    if (LANGUAGE_LOCALE_MAP[languageCode]) {
        return LANGUAGE_LOCALE_MAP[languageCode];
    }
    
    // Check if the code is already a full locale (e.g., 'ta-IN') and we have a mapping for the prefix
    const prefix = languageCode.split('-')[0];
    if (LANGUAGE_LOCALE_MAP[prefix]) {
        return LANGUAGE_LOCALE_MAP[prefix];
    }

    return languageCode;
};

export const speak = async (text: string, language: string) => {
    if (!text) return;
    const locale = getLocaleForLanguage(language);
    console.log(`TTS Speaking: "${text}" in language: ${language} -> mapped to: ${locale}`);

    let options: Speech.SpeechOptions = { language: locale };

    if (Platform.OS === 'web') {
        try {
            const voices = await Speech.getAvailableVoicesAsync();
            console.log("Available voices on this browser:", voices.map(v => `${v.language} (${v.name})`).join(", "));

            // 1. Try exact match
            let voice = voices.find(v => v.language === locale);
            
            // 2. Try match starting with locale (e.g. 'ta-IN' matches 'ta-IN-Standard-A')
            if (!voice) {
                voice = voices.find(v => v.language.startsWith(locale));
            }

            // 3. Try match with short code (e.g. 'ta' matches 'ta-IN')
            if (!voice) {
                const shortCode = locale.split('-')[0];
                voice = voices.find(v => v.language.startsWith(shortCode));
            }

            if (voice) {
                console.log(`Web Voice selected: ${voice.name} (${voice.language})`);
                options.voice = voice.identifier;
            } else {
                console.warn(`No specific voice found for ${locale} on Web, letting browser decide.`);
            }
        } catch (e) {
            console.error("Failed to fetch voices on web:", e);
        }
    }

    Speech.speak(text, options);
};

export const stopSpeaking = () => {
    Speech.stop();
};

export const isSpeaking = async () => {
    return await Speech.isSpeakingAsync();
};
