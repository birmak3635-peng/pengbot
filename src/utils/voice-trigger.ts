/**
 * Sesli yanıt tetikleyicisi kontrolü.
 * "reply with voice" (veya "sesli yanıtla") ifadesini kontrol eder.
 */

/**
 * Kullanıcı mesajında sesli yanıt talebi olup olmadığını kontrol eder.
 * @param text - Kullanıcı mesajı
 * @returns boolean - Sesli yanıt talebi varsa true
 */
export function containsVoiceTrigger(text: string): boolean {
    const trigger = "reply with voice";
    const localTrigger = "sesli yanıtla"; // Türkçe destek için ekleyelim
    const normalized = text.toLowerCase().trim();

    return normalized.includes(trigger) || normalized.includes(localTrigger);
}
