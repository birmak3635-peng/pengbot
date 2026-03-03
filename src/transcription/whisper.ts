/**
 * OpenAI Whisper API ile transcription.
 * TRANSCRIPTION_API_KEY gerektirir.
 */

import { config } from "../config/env.js";
import type { TranscriptionResult } from "./index.js";

const WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions";

/**
 * Whisper API'ye ses dosyasını gönderir ve metin döndürür.
 */
export async function transcribeWithWhisper(
    audioBuffer: Buffer,
    filename: string
): Promise<TranscriptionResult> {
    if (!config.transcriptionApiKey) {
        return {
            success: false,
            error: "TRANSCRIPTION_API_KEY ayarlanmamış. .env dosyasını kontrol edin.",
        };
    }

    console.log(`🎤 Whisper API'ye gönderiliyor... (${(audioBuffer.length / 1024).toFixed(1)} KB)`);

    // FormData oluştur — Node.js 18+ native fetch + FormData
    const formData = new FormData();

    // Buffer'ı Blob'a çevir — explicit ArrayBuffer cast
    const arrayBuf = audioBuffer.buffer.slice(
        audioBuffer.byteOffset,
        audioBuffer.byteOffset + audioBuffer.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuf], { type: getMimeType(filename) });
    formData.append("file", blob, ensureExtension(filename));
    formData.append("model", "whisper-1");
    formData.append("response_format", "json");

    const response = await fetch(WHISPER_API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.transcriptionApiKey}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`❌ Whisper API hatası (${response.status}):`, errorBody);
        return {
            success: false,
            error: `Whisper API hatası: ${response.status} — ${errorBody.substring(0, 200)}`,
        };
    }

    const data = (await response.json()) as { text: string };

    if (!data.text || data.text.trim().length === 0) {
        return {
            success: false,
            error: "Ses dosyasından metin çıkarılamadı. Dosya çok kısa veya sessiz olabilir.",
        };
    }

    console.log(`✅ Transcription başarılı (${data.text.length} karakter)`);
    return {
        success: true,
        text: data.text.trim(),
    };
}

/** Dosya uzantısına göre MIME type döndürür */
function getMimeType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
        ogg: "audio/ogg",
        oga: "audio/ogg",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        m4a: "audio/m4a",
        webm: "audio/webm",
        flac: "audio/flac",
    };
    return mimeMap[ext ?? ""] ?? "audio/ogg";
}

/** Dosya adında uzantı yoksa .ogg ekler */
function ensureExtension(filename: string): string {
    if (filename.includes(".")) return filename;
    return `${filename}.ogg`;
}
