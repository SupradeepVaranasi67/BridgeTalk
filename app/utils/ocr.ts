
import TextRecognition from "@react-native-ml-kit/text-recognition";

export async function recognizeTextFromImage(imagePath: string): Promise<string> {
  try {
    const result = await TextRecognition.recognize(imagePath);
    return result.text;
  } catch (error) {
    console.error("Text recognition failed:", error);
    throw new Error("Failed to recognize text from the image.");
  }
}
