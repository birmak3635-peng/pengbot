/**
 * Transcription modülü için basit test.
 * Çalıştırmak için: npx tsx src/transcription/__test__.ts
 */

import { transcribeMock } from "./mock.js";

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

console.log("\n🧪 Transcription Mock Testi\n");

// ─── Test 1: Normal buffer başarılı olmalı ───
console.log("Test 1: Normal buffer transcription");
{
    const buffer = Buffer.alloc(1024, "hello");
    const result = transcribeMock(buffer, "test.ogg");
    assert(result.success === true, "success === true");
    assert(typeof result.text === "string", "text bir string");
    assert(result.text!.length > 0, "text boş değil");
    assert(result.error === undefined, "error yok");
}

// ─── Test 2: Çok küçük buffer hata döndürmeli ───
console.log("\nTest 2: Küçük buffer hata dönmeli");
{
    const buffer = Buffer.alloc(10);
    const result = transcribeMock(buffer, "tiny.ogg");
    assert(result.success === false, "success === false");
    assert(result.text === undefined, "text yok");
    assert(typeof result.error === "string", "error mesajı var");
}

// ─── Test 3: Farklı boyutlar farklı mock yanıtlar döndürmeli ───
console.log("\nTest 3: Deterministik mock yanıtlar");
{
    const buf1 = Buffer.alloc(500);
    const buf2 = Buffer.alloc(501);
    const r1 = transcribeMock(buf1, "a.ogg");
    const r2 = transcribeMock(buf2, "b.ogg");
    assert(r1.success && r2.success, "her ikisi de başarılı");
    assert(r1.text !== r2.text, "farklı boyutlar farklı yanıtlar veriyor");
}

// ─── Test 4: Aynı boyut aynı mock yanıt döndürmeli ───
console.log("\nTest 4: Aynı boyut = aynı yanıt (deterministik)");
{
    const buf1 = Buffer.alloc(500);
    const buf2 = Buffer.alloc(500);
    const r1 = transcribeMock(buf1, "a.ogg");
    const r2 = transcribeMock(buf2, "b.ogg");
    assert(r1.text === r2.text, "aynı boyut = aynı yanıt");
}

// ─── Sonuç ───
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  Sonuç: ${passed} başarılı, ${failed} başarısız`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

if (failed > 0) {
    process.exit(1);
}
