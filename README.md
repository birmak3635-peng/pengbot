# 🤖 Gravity Claw

Telegram üzerinden çalışan, Claude LLM destekli kişisel AI asistan.

## 🚀 Hızlı Kurulum

### 1. Ortam Değişkenlerini Ayarla

```bash
copy .env.template .env
```

`.env` dosyasını açıp gerçek değerleri girin:

| Değişken | Nereden Alınır |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Telegram'da [@BotFather](https://t.me/BotFather) → `/newbot` |
| `MODEL_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `TELEGRAM_ALLOWLIST_USER_ID` | Telegram'da [@userinfobot](https://t.me/userinfobot) mesaj gönderin |
| `TRANSCRIPTION_API_KEY` | [platform.openai.com](https://platform.openai.com) → API Keys *(sesli mesaj için)* |
| `TTS_API_KEY` | [platform.openai.com](https://platform.openai.com) → API Keys *(sesli yanıt için)* |
| `HEARTBEAT_ENABLED` | `true`/`false` - Günlük sabah mesajlarını açar/kapatır |

### 2. Bağımlılıkları Kur

```bash
npm install
```

### 3. Çalıştır

```bash
npm run dev
```

## 🎤 Sesli Mesaj Desteği (Inbound)

Gravity Claw artık Telegram sesli mesajlarını destekliyor! Akış şöyle çalışır:

1. Kullanıcı sesli mesaj gönderiyor
2. Bot ses dosyasını Telegram'dan indiriyor
3. OpenAI Whisper API ile metne çevriliyor
4. Transcription kullanıcıya gösteriliyor
5. Metin Claude'a gönderilip yanıt alınıyor

## 🗣️ Sesli Yanıt Desteği (Outbound)

Gravity Claw artık isteğe bağlı sesli yanıtlar (TTS) verebiliyor!

### Nasıl Kullanılır?

Botun sesli yanıt vermesini istiyorsanız, mesajınızın içine **"reply with voice"** veya **"sesli yanıtla"** ifadesini eklemeniz yeterlidir.

## 🧠 Uzun Süreli Hafıza (Memory)

Gravity Claw artık bilgileri hatırlayabiliyor!

### 1. Core Memory (Statik)
`memory/core_memory.md` dosyasını düzenleyerek bota seninle ilgili kalıcı bilgileri (isim, tercihler vb.) öğretebilirsin. Bot her mesajda bu dosyayı okur.

### 2. Vektör Hafıza (Dinamik)
Önemli bilgileri anlık olarak kaydetmek ve geri çağırmak için kullanılır.

- **`/remember <bilgi>`**: Botun önemli bir şeyi hatırlamasını sağlar.
- **`/recall <sorgu>`**: Botun hafızasında manuel arama yapmanı sağlar.
- Bot her mesajında, o anki bağlamla ilgili en yakın 3 anıyı otomatik olarak hatırlar.

## 💓 Heartbeat (Günlük Kontrol)
Gravity Claw her sabah saat 08:00'de size proaktif bir mesaj atarak günün önceliklerini sorar.
- **Tetikleme**: `.env` içindeki `HEARTBEAT_ENABLED=true` ile aktif edilir.
- **Test**: `/heartbeat_test` komutu ile anlık test edilebilir.

### Gizlilik ve Güvenlik
- Tüm anılar `memory/memory_log.md` dosyasında denetim için saklanır.
- Vektör DB (optional) sadece `VECTOR_DB_API_KEY` girildiğinde aktif olur. Aksi takdirde yerel dosya sistemi (fallback) kullanılır.

## ✅ Self-Test Checklist

| # | Test | Beklenen Sonuç |
|---|---|---|
| 1 | Konsolda `🚀 Gravity Claw is alive!` mesajı var mı? | ✅ Bot başarıyla başladı |
| 2 | Konsolda `💓 Heartbeat: aktif` görünüyor mu? | ✅ Zamanlayıcı servis devrede |
| 3 | Telegram'da bota `/start` gönderin | ✅ Hoş geldin mesajı + servis durumlarını alırsınız |
| 4 | `/heartbeat_test` gönderin | ✅ Günaydın mesajını anında alırsınız |
| 5 | Sesli mesaj gönderin | ✅ Transcription + AI yanıtı alırsınız |

## 📁 Proje Yapısı

```
peng/
├── src/
│   ├── agent/           # LLM logic & tools
│   ├── bot/             # Telegram bot core
│   ├── services/        # Periodic/Heartbeat services
│   ├── memory/          # Vector & core memory
│   ├── transcription/   # Whisper integration
│   ├── tts/             # OpenAI TTS integration
│   └── index.ts         # Entry point
```

## 🗺️ Yol Haritası

- [x] **Level 1** — Foundation: Telegram + Claude + Agent Loop
- [x] **Level 2** — Memory: Core Memory + Vektör Hafıza (Local Fallback)
- [x] **Level 3** — Voice: Whisper (inbound) + OpenAI TTS (outbound)
- [x] **Level 4** — Tools: MCP bridge (Notion, Google Calendar/Drive)
- [x] **Level 5** — Heartbeat: Proaktif sabah mesajları (node-cron)
