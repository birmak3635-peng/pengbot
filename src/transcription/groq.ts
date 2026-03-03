import Groq from "groq-sdk";
import { config } from "../config/env.js";
import type { TranscriptionResult } from "./index.js";

/**
 * Groq Whisper API ile transcription.
 */
export async function transcribeWithGroq(
    audioBuffer: Buffer,
    filename: string
): Promise<TranscriptionResult> {
    if (!config.groqApiKey) {
        return {
            success: false,
            error: "GROQ_API_KEY ayarlanmamış.",
        };
    }

    try {
        console.log(`🎤 Groq Whisper API'ye gönderiliyor... (${(audioBuffer.length / 1024).toFixed(1)} KB)`);

        const groq = new Groq({
            apiKey: config.groqApiKey,
        });

        // Buffer'ı ArrayBuffer'a çevir (Whisper'daki gibi garantili yöntem)
        const arrayBuf = audioBuffer.buffer.slice(
            audioBuffer.byteOffset,
            audioBuffer.byteOffset + audioBuffer.byteLength
        ) as ArrayBuffer;

        // Groq Whisper'ın kabul ettiği bir MIME tipi ve dosya adı belirleyelim
        // Telegram sesleri Genellikle .oga/ogg (Opus) formatındadır.
        const safeFilename = filename.endsWith(".oga") || filename.endsWith(".ogg")
            ? filename.replace(/\.(oga|ogg)$/, ".mp3") // .mp3 etiketi Groq'u mutlu eder (içerik opus olsa bile)
            : filename;

        const file = new File([arrayBuf], safeFilename, { type: "audio/mpeg" });

        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: "whisper-large-v3-turbo", // Groq'un en hızlı ve kaliteli modeli
            response_format: "json",
            language: "tr", // Türkçe olduğu için belirleyelim
        });

        if (!transcription.text || transcription.text.trim().length === 0) {
            return {
                success: false,
                error: "Groq: Metin çıkarılamadı.",
            };
        }

        console.log(`✅ Groq Transcription başarılı: "${transcription.text.substring(0, 30)}..."`);

        return {
            success: true,
            text: transcription.text.trim(),
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ Groq Transcription hatası:", message);
        return {
            success: false,
            error: `Groq Hatası: ${message}`,
        };
    }
}
