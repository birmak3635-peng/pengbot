import fs from "fs/promises";
import path from "path";

/**
 * Core memory dosyasını (memory/core_memory.md) okur.
 */
export async function readCoreMemory(): Promise<string> {
    const filePath = path.join(process.cwd(), "memory", "core_memory.md");
    try {
        return await fs.readFile(filePath, "utf-8");
    } catch (err) {
        console.warn("⚠️ core_memory.md okunamadı.");
        return "";
    }
}

/**
 * Soul dosyasını (memory/soul.md) okur.
 * Botun kişiliğini ve iletişim tarzını tanımlar.
 */
export async function readSoul(): Promise<string> {
    const filePath = path.join(process.cwd(), "memory", "soul.md");
    try {
        return await fs.readFile(filePath, "utf-8");
    } catch (err) {
        console.warn("⚠️ soul.md okunamadı.");
        return "";
    }
}
