/**
 * Mock transcription — geliştirme/test ortamında kullanılır.
 * Gerçek API çağrısı yapmadan simülasyon yapar.
 */

import type { TranscriptionResult } from "./index.js";

/** Rastgele mock yanıtlar */
const MOCK_RESPONSES = [
    "Bu bir test sesli mesajıdır.",
    "Merhaba, nasılsın? Bugün hava çok güzel.",
    "Yarınki toplantıyı hatırlat lütfen.",
    "Gravity Claw'a sesli mesaj gönderiyorum.",
    "Alışveriş listesine süt ve ekmek ekle.",
];

/**
 * Buffer boyutuna göre basit bir mock transcription döndürür.
 * Gerçek ses işleme yapmaz — sadece simülasyon.
 */
export function transcribeMock(
    audioBuffer: Buffer,
    _filename: string
): TranscriptionResult {
    // Çok küçük buffer'ları hata olarak döndür (gerçekçi simülasyon)
    if (audioBuffer.length < 100) {
        return {
            success: false,
            error: "Ses dosyası çok kısa veya bozuk.",
        };
    }

    // Buffer boyutuna göre deterministik bir mock yanıt seç
    const index = audioBuffer.length % MOCK_RESPONSES.length;
    const mockText = MOCK_RESPONSES[index];

    return {
        success: true,
        text: mockText,
    };
}
