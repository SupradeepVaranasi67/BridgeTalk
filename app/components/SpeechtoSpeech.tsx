import React, { useState, useEffect, useRef } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, Platform, Animated, ScrollView, Switch, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import LanguagePicker from "./LanguagePicker";
import { getSupportedLanguages } from "../services/engines/google";
import { 
  addToHistory, 
  saveConversationSession, 
  addToFavorites, 
  Translation, 
  ConversationTurn 
} from "../services/storage";
import { useThemeColor } from "../hooks/use-theme-color";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

const GOOGLE_API_KEY = "AIzaSyD7rCz6W5arnQ9_3nQcLecTL1_9fVPkBIc";
const TRANSLATE_API_KEY = "2313984740msh78647075e369a68p14bcb9jsnf356f69bca55";
const TRANSLATE_API_HOST = "google-translate113.p.rapidapi.com";

export default function SpeechToSpeech() {
  const router = useRouter();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const [languages, setLanguages] = useState<{ language: string; name: string }[]>([]);
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("hi");

  // Single Mode State
  const [recognized, setRecognized] = useState("");
  const [translated, setTranslated] = useState("");
  const [currentTranslationId, setCurrentTranslationId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);

  // Conversation Mode State
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [currentTurns, setCurrentTurns] = useState<ConversationTurn[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<'ask' | 'answer' | null>(null);
  
  // Display state for conversation mode (latest turn)
  const [lastAskTurn, setLastAskTurn] = useState<ConversationTurn | null>(null);
  const [lastAnswerTurn, setLastAnswerTurn] = useState<ConversationTurn | null>(null);

  const soundRefs = useRef<{ start: Audio.Sound | null; stop: Audio.Sound | null }>({
    start: null,
    stop: null,
  });

  const meteringAnim = useRef(new Animated.Value(1)).current;

  // Theming
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const iconColor = useThemeColor({}, 'icon');

  const isMounted = useRef(true);

  // Fetch supported languages and preload sounds
  useEffect(() => {
    isMounted.current = true;

    async function init() {
      try {
        const langs = await getSupportedLanguages();
        if (isMounted.current) {
          setLanguages([{ language: "auto", name: "Auto Detect" }, ...langs]);
        }
      } catch (err) {
        console.error("Failed to load languages:", err);
      }

      // Setup Audio Mode
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (err) {
        console.log("Failed to set audio mode", err);
      }

      // Preload sounds
      try {
        const startSound = new Audio.Sound();
        const stopSound = new Audio.Sound();
        await startSound.loadAsync({ uri: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3" });
        await stopSound.loadAsync({ uri: "https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/pause.mp3" });
        
        if (isMounted.current) {
          soundRefs.current.start = startSound;
          soundRefs.current.stop = stopSound;
        } else {
          // If unmounted during load, unload immediately
          startSound.unloadAsync();
          stopSound.unloadAsync();
        }
      } catch (err) {
        console.log("Failed to preload sounds:", err);
      }
    }
    init();

    return () => {
      isMounted.current = false;
      // Cleanup sounds
      if (soundRefs.current.start) soundRefs.current.start.unloadAsync();
      if (soundRefs.current.stop) soundRefs.current.stop.unloadAsync();
      
      // Stop speech
      Speech.stop();
    };
  }, []);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        // Ignore errors if already unloaded
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  // ------------------------------
  // Sound Feedback
  // ------------------------------
  async function playSound(type: "start" | "stop") {
    try {
      const sound = soundRefs.current[type];
      if (sound) {
        await sound.replayAsync();
      } else {
        // Fallback if not loaded
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: type === "start" 
            ? "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3" 
            : "https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/pause.mp3" 
          }
        );
        await newSound.playAsync();
      }
    } catch (error) {
      console.log("Failed to play sound", error);
    }
  }

  // ------------------------------
  // Translate Text
  // ------------------------------
  async function translateText(text: string, from: string, to: string) {
    try {
      const body = {
        from: from,
        to: to,
        protected_paths: [],
        common_protected_paths: [],
        json: { text: text },
      };

      const res = await fetch(
        `https://${TRANSLATE_API_HOST}/api/v1/translator/json`,
        {
          method: "POST",
          headers: {
            "X-RapidAPI-Key": TRANSLATE_API_KEY,
            "X-RapidAPI-Host": TRANSLATE_API_HOST,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const json = await res.json();
      console.log("Raw translation response:", json);

      if (json.error || !json.trans) {
        Alert.alert("Translation Error", JSON.stringify(json));
      }

      const translatedText = json.trans?.text || "Translation failed";
      return translatedText;
    } catch (err) {
      console.error("Translation API error:", err);
      Alert.alert("Translation Exception", String(err));
      return "Translation failed";
    }
  }

  // ------------------------------
  // Recording Options
  // ------------------------------
  const recordingOptions: any = {
    isMeteringEnabled: true,
    android: {
      extension: ".amr",
      outputFormat: Audio.AndroidOutputFormat.AMR_WB,
      audioEncoder: Audio.AndroidAudioEncoder.AMR_WB,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 128000,
    },
    ios: {
      extension: ".wav",
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: "audio/webm",
      bitsPerSecond: 128000,
    },
  };

  // ------------------------------
  // Start Recording
  // ------------------------------
  async function startRecording(speaker: 'ask' | 'answer' = 'ask') {
    // Immediate feedback
    playSound("start");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isConversationMode) {
      setActiveSpeaker(speaker);
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") return alert("Mic permission denied");

      const { recording } = await Audio.Recording.createAsync(
        recordingOptions,
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
             const db = status.metering;
             const scale = 1 + Math.max(0, (db + 60) / 60) * 0.5;
             
             Animated.timing(meteringAnim, {
               toValue: scale,
               duration: 50,
               useNativeDriver: true,
             }).start();
          }
        },
        100
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.log("Start recording error:", err);
      Alert.alert("Error", "Failed to start recording");
    }
  }

  // ------------------------------
  // Stop Recording → STT → Translate
  // ------------------------------
  async function stopRecording() {
    // Immediate feedback
    playSound("stop");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Reset animation
    Animated.timing(meteringAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    try {
      if (!recording) return;

      if (isMounted.current) {
        setLoading(true);
        setIsRecording(false);
      }
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (isMounted.current) {
        setRecording(null); // Reset recording instance
      }

      if (!uri) return;

      const sttText = await processSTT(uri);
      if (!sttText) {
        if (isMounted.current) {
          setTranslated("No text detected");
          setLoading(false);
        }
        return;
      }
      
      // Determine languages based on mode and speaker
      let fromLang = sourceLang;
      let toLang = targetLang;

      if (isConversationMode && activeSpeaker === 'answer') {
        fromLang = targetLang;
        toLang = sourceLang;
      }

      const translatedText = await translateText(sttText, fromLang, toLang);
      
      if (isMounted.current) {
        if (isConversationMode && activeSpeaker) {
          const turn: ConversationTurn = {
            id: Date.now().toString(),
            text: sttText,
            translation: translatedText,
            originalLang: fromLang,
            translatedLang: toLang,
            speaker: activeSpeaker,
            timestamp: Date.now(),
          };

          setCurrentTurns(prev => [...prev, turn]);
          
          if (activeSpeaker === 'ask') {
            setLastAskTurn(turn);
          } else {
            setLastAnswerTurn(turn);
          }
          
          Speech.speak(translatedText, { language: toLang });
          setActiveSpeaker(null);
        } else {
          // Single Mode
          setRecognized(sttText);
          setTranslated(translatedText);
          
          const newItem: Translation = {
            id: Date.now().toString(),
            sourceText: sttText,
            translatedText: translatedText,
            sourceLang: fromLang,
            targetLang: toLang,
            timestamp: Date.now(),
            type: 'speech',
            audioUri: uri,
          };
          setCurrentTranslationId(newItem.id);
          await addToHistory(newItem);
          Speech.speak(translatedText, { language: toLang });
        }
      }

    } catch (err) {
      console.log("Stop error:", err);
      Alert.alert("Error", "Failed to process speech");
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }

  // ------------------------------
  // End Conversation
  // ------------------------------
  async function endConversation() {
    if (currentTurns.length === 0) {
      Alert.alert("No conversation", "No turns to save.");
      return;
    }

    try {
      await saveConversationSession({
        id: Date.now().toString(),
        timestamp: Date.now(),
        sourceLang,
        targetLang,
        turns: currentTurns,
      });
      
      setCurrentTurns([]);
      setLastAskTurn(null);
      setLastAnswerTurn(null);
      Alert.alert("Saved", "Conversation saved to history.");
    } catch (err) {
      console.error("Failed to save conversation", err);
      Alert.alert("Error", "Failed to save conversation.");
    }
  }

  // ------------------------------
  // Favorites
  // ------------------------------
  async function handleAddToFavorites() {
    if (!recognized || !translated || !currentTranslationId) return;
    
    const item: Translation = {
      id: currentTranslationId,
      sourceText: recognized,
      translatedText: translated,
      sourceLang: sourceLang,
      targetLang: targetLang,
      timestamp: Date.now(),
      type: 'speech',
    };
    
    await addToFavorites(item);
    Alert.alert("Success", "Added to favorites!");
  }

  // ------------------------------
  // STT helpers (Google Cloud)
  // ------------------------------
  function mapLanguageToBCP47(code: string): string {
    const mapping: { [key: string]: string } = {
      en: "en-US",
      hi: "hi-IN",
      es: "es-ES",
      fr: "fr-FR",
      de: "de-DE",
      it: "it-IT",
      ja: "ja-JP",
      ko: "ko-KR",
      zh: "zh-CN",
      pt: "pt-BR",
      ru: "ru-RU",
    };
    return mapping[code] || code;
  }

  async function processSTT(uri: string) {
    try {
      const fileBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      // Determine language code for STT
      let langForSTT = sourceLang;
      if (isConversationMode && activeSpeaker === 'answer') {
        langForSTT = targetLang;
      }
      
      const langCode = langForSTT === "auto" ? "en-US" : mapLanguageToBCP47(langForSTT);

      // Determine encoding config based on platform
      let encodingConfig;
      if (Platform.OS === "android") {
        encodingConfig = {
          encoding: "AMR_WB",
          sampleRateHertz: 16000,
        };
      } else if (Platform.OS === "ios") {
        encodingConfig = {
          encoding: "LINEAR16",
          sampleRateHertz: 44100,
        };
      } else {
        // Fallback or web
        encodingConfig = {
           // Let Google detect or default
        };
      }

      const body = {
        config: {
          languageCode: langCode,
          enableAutomaticPunctuation: true,
          ...encodingConfig,
        },
        audio: {
          content: fileBase64,
        },
      };
      
      const res = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const json = await res.json();
      console.log("Google STT Response:", JSON.stringify(json, null, 2));

      if (json.error) {
        throw new Error(json.error.message);
      }

      if (!json.results || json.results.length === 0) {
        return "";
      }

      // Combine all transcripts
      const transcripts = json.results
        .map((result: any) => {
          if (result.alternatives && result.alternatives.length > 0) {
            return result.alternatives[0].transcript;
          }
          return "";
        })
        .filter((t: string) => t) // Filter out empty strings
        .join("\n");
      
      return transcripts;

    } catch (err) {
      console.error("Google STT Error:", err);
      Alert.alert("STT Error", "Failed to recognize speech");
      return null;
    }
  }

  // ------------------------------
  // UI Components
  // ------------------------------
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (currentTurns.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [currentTurns]);

  const renderMicButton = (speaker: 'ask' | 'answer', isRecordingThis: boolean) => (
    <View style={{ alignItems: 'center' }}>
      <View style={{ position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
        {isRecordingThis && (
          <Animated.View
            style={{
              position: 'absolute',
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(0, 122, 255, 0.3)',
              transform: [{ scale: meteringAnim }],
            }}
          />
        )}
        <TouchableOpacity
          onPress={() => isRecording ? stopRecording() : startRecording(speaker)}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: isRecordingThis ? "#ff4444" : primaryColor,
            justifyContent: "center",
            alignItems: "center",
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            zIndex: 1,
          }}
          disabled={isRecording && !isRecordingThis}
        >
          <Ionicons name={isRecordingThis ? "stop" : "mic"} size={30} color="white" />
        </TouchableOpacity>
      </View>
      <ThemedText style={{ marginTop: 4, fontSize: 12, fontWeight: '600' }}>
        {speaker === 'ask' ? sourceLang.toUpperCase() : targetLang.toUpperCase()}
      </ThemedText>
    </View>
  );

  const renderChatBubble = ({ item }: { item: ConversationTurn }) => {
    const isAsk = item.speaker === 'ask';
    return (
      <View style={{
        alignSelf: isAsk ? 'flex-start' : 'flex-end',
        backgroundColor: isAsk ? '#e6f2ff' : '#f0fff4', // Keep these colors for chat bubbles as they are standard
        borderRadius: 12,
        padding: 12,
        marginVertical: 6,
        maxWidth: '80%',
        elevation: 1,
        borderWidth: 1,
        borderColor: isAsk ? '#b3d9ff' : '#c3e6cb',
      }}>
        <Text style={{ fontSize: 16, color: '#333', marginBottom: 4 }}>{item.text}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
           {/* Indent translation slightly */}
           <View style={{ width: 10 }} />
           <Text style={{ fontSize: 16, color: '#007AFF', fontWeight: '500', flex: 1 }}>{item.translation}</Text>
           <TouchableOpacity onPress={() => Speech.speak(item.translation, { language: item.translatedLang })}>
             <Ionicons name="volume-high" size={18} color="#007AFF" style={{ marginLeft: 6 }} />
           </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ------------------------------
  // Main Render
  // ------------------------------
  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 50, backgroundColor: cardColor, elevation: 2 }}>
        {/* Segmented Control */}
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(150, 150, 150, 0.2)', borderRadius: 8, padding: 4 }}>
          <TouchableOpacity 
            onPress={() => setIsConversationMode(false)}
            style={{ 
              flex: 1, 
              paddingVertical: 8, 
              alignItems: 'center', 
              borderRadius: 6,
              backgroundColor: !isConversationMode ? cardColor : 'transparent',
              elevation: !isConversationMode ? 2 : 0,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: !isConversationMode ? 0.2 : 0,
              shadowRadius: 1.41,
            }}
          >
            <ThemedText style={{ fontWeight: !isConversationMode ? 'bold' : 'normal', opacity: !isConversationMode ? 1 : 0.7 }}>Single</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setIsConversationMode(true)}
            style={{ 
              flex: 1, 
              paddingVertical: 8, 
              alignItems: 'center', 
              borderRadius: 6,
              backgroundColor: isConversationMode ? cardColor : 'transparent',
              elevation: isConversationMode ? 2 : 0,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isConversationMode ? 0.2 : 0,
              shadowRadius: 1.41,
            }}
          >
            <ThemedText style={{ fontWeight: isConversationMode ? 'bold' : 'normal', opacity: isConversationMode ? 1 : 0.7 }}>Conversation</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {isConversationMode ? (
        // Chat UI
        <View style={{ flex: 1 }}>
          {/* Top Language Pickers */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: cardColor, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <View style={{ flex: 1, marginRight: 5 }}>
               <ThemedText style={{ fontSize: 12, marginBottom: 2, textAlign: 'center' }}>Speaker 1 (Left)</ThemedText>
               <LanguagePicker value={sourceLang} onChange={setSourceLang} options={languages} />
            </View>
            <View style={{ flex: 1, marginLeft: 5 }}>
               <ThemedText style={{ fontSize: 12, marginBottom: 2, textAlign: 'center' }}>Speaker 2 (Right)</ThemedText>
               <LanguagePicker value={targetLang} onChange={setTargetLang} options={languages} />
            </View>
          </View>

          {/* Chat Area */}
          <FlatList
            ref={flatListRef}
            data={currentTurns}
            renderItem={renderChatBubble}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
            style={{ flex: 1 }}
          />

          {/* Bottom Controls */}
          <View style={{ padding: 20, backgroundColor: cardColor, borderTopWidth: 1, borderTopColor: '#eee' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
               {/* Left Mic */}
               {renderMicButton('ask', isRecording && activeSpeaker === 'ask')}
               
               {/* End Button */}
               <TouchableOpacity 
                  onPress={endConversation}
                  style={{ backgroundColor: '#FF3B30', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>End Chat</Text>
                </TouchableOpacity>

               {/* Right Mic */}
               {renderMicButton('answer', isRecording && activeSpeaker === 'answer')}
            </View>
          </View>
        </View>
      ) : (
        // Single Mode UI
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <ThemedText style={{ marginBottom: 8 }}>Select Source Language:</ThemedText>
          {languages.length > 0 && (
            <LanguagePicker value={sourceLang} onChange={setSourceLang} options={languages} />
          )}

          <ThemedText style={{ marginVertical: 8 }}>Select Target Language:</ThemedText>
          {languages.length > 0 && (
            <LanguagePicker value={targetLang} onChange={setTargetLang} options={languages} />
          )}

          <View style={{ alignItems: "center", marginVertical: 40 }}>
            {renderMicButton('ask', isRecording)}
            <ThemedText style={{ marginTop: 10, opacity: 0.7 }}>
              {isRecording ? "Tap to Stop & Translate" : "Tap to Speak"}
            </ThemedText>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ThemedText style={{ fontSize: 18, fontWeight: "bold", flex: 1 }}>Recognized Speech:</ThemedText>
            <TouchableOpacity onPress={() => Speech.speak(recognized, { language: sourceLang === 'auto' ? 'en-US' : sourceLang })}>
              <Ionicons name="volume-high" size={24} color={primaryColor} />
            </TouchableOpacity>
          </View>
          <ThemedText style={{ fontSize: 16, marginTop: 5, minHeight: 40, marginBottom: 20 }}>{recognized}</ThemedText>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ThemedText style={{ fontSize: 18, fontWeight: "bold", flex: 1 }}>Translated Output:</ThemedText>
            <TouchableOpacity onPress={() => Speech.speak(translated, { language: targetLang })} style={{ marginRight: 15 }}>
              <Ionicons name="volume-high" size={24} color={primaryColor} />
            </TouchableOpacity>
            {translated ? (
              <TouchableOpacity onPress={handleAddToFavorites}>
                <Ionicons name="heart-outline" size={24} color={primaryColor} />
              </TouchableOpacity>
            ) : null}
          </View>
          <ThemedText style={{ fontSize: 16, marginTop: 5, minHeight: 40 }}>{translated}</ThemedText>
        </ScrollView>
      )}

      {loading && (
        <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, alignItems: "center" }}>
          <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', padding: 20, borderRadius: 10 }}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ marginTop: 10, color: '#fff' }}>Processing...</Text>
          </View>
        </View>
      )}
    </ThemedView>
  );
}
