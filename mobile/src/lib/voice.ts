import * as Speech from "expo-speech";

export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: "en-US",
      rate: 0.95,
      pitch: 1.05,
      onDone: resolve,
      onError: () => resolve(),
      onStopped: () => resolve(),
    });

    // Safety timeout
    setTimeout(resolve, 15000);
  });
}

export function stopSpeaking() {
  Speech.stop();
}

export function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
