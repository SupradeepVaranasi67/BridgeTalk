import React from 'react';
import { View } from 'react-native';
import SpeechToSpeech from './components/SpeechtoSpeech';

export default function SpeechTranslateScreen() {
  return (
    <View style={{ flex: 1 }}>
      <SpeechToSpeech />
    </View>
  );
}
