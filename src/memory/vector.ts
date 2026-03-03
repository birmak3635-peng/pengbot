import fs from "fs/promises";
import path from "path";
import { config } from "../config/env.js";

/**
 * Bellek kaydı arayüzü
 */
export interface MemoryEntry {
    content: string;
    timestamp: string;
    id: string;
}

/**
 * Anlık bellek günlüğüne (memory/memory_log.md) yeni bir giriş ekler.
 */
export async function appendToMemoryLog(text: string): Promise<void> {
    const filePath = path.join(process.cwd(), "memory", "memory_log.md");
    const date = new Date().toISOString().split("T")[0];
    const entry = `\n[${date}] 📌 ${text}`;

    try {
        await fs.appendFile(filePath, entry, "utf-8");
    } catch (err) {
        console.error("❌ memory_log.md dosyasına yazılamadı:", err);
    }
}

/**
 * Vektör tabanlı bellek simülasyonu.
 * Gerçek bir VDB (Pinecone vb.) entegrasyonu buraya gelecek.
 */
export async function storeInMemory(text: string): Promise<void> {
    if (!config.vectorDbApiKey || !config.vectorDbIndex) {
        console.log("🧠 [MOCK] VDB ayarlanmamış, sadece loga kaydediliyor.");
        await appendToMemoryLog(text);
        return;
    }

    // Gerçek API çağrısı simülasyonu
    console.log(`🧠 [VDB] Kaydediliyor: "${text.substring(0, 30)}..."`);
    await appendToMemoryLog(text);
}

/**
 * Bellekten sorgu ile ilgili kayıtları getirir (top-k).
 */
export async function recallFromMemory(query: string, k: number = 3): Promise<string[]> {
    if (!config.vectorDbApiKey || !config.vectorDbIndex) {
        console.log(`🧠 [MOCK] VDB ayarlanmamış, "${query}" için mock sonuçlar dönülüyor.`);
        // memory_log.md'den çok basit bir arama yapalım (sadece simülasyon)
        try {
            const filePath = path.join(process.cwd(), "memory", "memory_log.md");
            const content = await fs.readFile(filePath, "utf-8");
            const lines = content.split("\n").filter(l => l.includes("📌") && l.toLowerCase().includes(query.toLowerCase()));
            const results = lines.slice(-k).map(l => l.split("📌")[1].trim());
            return results.length > 0 ? results : ["(Hafızada eşleşme bulunamadı)"];
        } catch {
            return ["(Hafızada eşleşme bulunamadı)"];
        }
    }

    // Gerçek VDB arama simülasyonu
    console.log(`🧠 [VDB] Sorgulanıyor: "${query}"`);
    return [`Simüle edilmiş VDB sonucu: ${query} ile ilgili bilgi.`];
}
