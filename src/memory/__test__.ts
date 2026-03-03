/**
 * Bellek sistemi testi — yazma ve okuma işlemlerini doğrular.
 * Çalıştırmak için: npx tsx src/memory/__test__.ts
 */

import { storeInMemory, recallFromMemory } from "./vector.js";
import fs from "fs/promises";
import path from "path";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string): void {
    if (condition) {
        console.log(`  ✅ ${testName}`);
        passed++;
    } else {
        console.error(`  ❌ ${testName}`);
        failed++;
    }
}

async function runTests() {
    console.log("\n🧪 Bellek Sistemi Testi (Local Fallback)\n");

    const testFact = `Test Bilgisi ${Date.now()}`;
    const testQuery = "Test Bilgisi";

    // ─── Test 1: Belleğe yazma ───
    console.log("Test 1: Belleğe yazma (/remember simülasyonu)");
    try {
        await storeInMemory(testFact);
        assert(true, "Yazma işlemi hata vermedi");
    } catch (err) {
        assert(false, `Yazma hatası: ${err}`);
    }

    // ─── Test 2: Bellekten çağırma ───
    console.log("\nTest 2: Bellekten çağırma (/recall simülasyonu)");
    try {
        const results = await recallFromMemory(testQuery, 1);
        assert(results.length > 0, "En az bir sonuç döndü");
        assert(results[0].includes(testQuery), "Dönen sonuç aranan kelimeyi içeriyor");
    } catch (err) {
        assert(false, `Okuma hatası: ${err}`);
    }

    // ─── Test 3: Olmayan bilgiyi arama ───
    console.log("\nTest 3: Olmayan bilgiyi arama");
    const results = await recallFromMemory("asdfghjkl_olmayan_bisey", 1);
    assert(results[0].includes("bulunamadı"), "Eşleşme yok mesajı alındı");

    // ─── Sonuç ───
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  Sonuç: ${passed} başarılı, ${failed} başarısız`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
