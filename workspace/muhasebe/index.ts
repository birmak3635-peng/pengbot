import * as readline from "readline";
import { addTransaction, addTodo, loadData } from "./storage.js";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const menu = `
--- Peng Muhasebe & ToDo ---
1. Gelir/Gider veya Alım/Satım Ekle
2. İşlemleri Listele (Kasa Durumu)
3. To-Do Ekle
4. To-Do Listesini Gör
5. Çıkış
Seçiminiz: `;

function ask() {
    rl.question(menu, async (answer) => {
        try {
            switch (answer.trim()) {
                case "1":
                    await handleAddTransaction();
                    break;
                case "2":
                    await handleListTransactions();
                    break;
                case "3":
                    await handleAddTodo();
                    break;
                case "4":
                    await handleListTodos();
                    break;
                case "5":
                    console.log("Görüşmek üzere!");
                    rl.close();
                    return;
                default:
                    console.log("Geçersiz seçim.");
            }
        } catch (err) {
            console.error("Bir hata oluştu:", err);
        }
        ask();
    });
}

async function handleAddTransaction() {
    rl.question("Tür (gelir/gider/alis/satis): ", (type) => {
        rl.question("Miktar (TL): ", (amountStr) => {
            rl.question("Açıklama: ", async (description) => {
                const amount = parseFloat(amountStr);
                if (isNaN(amount)) {
                    console.log("Hata: Miktar sayı olmalıdır.");
                } else {
                    await addTransaction({
                        type: type as "gelir" | "gider" | "alis" | "satis",
                        amount,
                        description
                    });
                    console.log("✅ İşlem kaydedildi.");
                }
                ask();
            });
        });
    });
}

async function handleListTransactions() {
    const data = await loadData();
    console.log("\n--- İşlem Geçmişi ---");
    let bakiye = 0;

    data.transactions.forEach(t => {
        const sign = (t.type === "gelir" || t.type === "satis") ? "+" : "-";
        bakiye += (sign === "+") ? t.amount : -t.amount;
        console.log(`[${new Date(t.date).toLocaleDateString()}] ${t.type.toUpperCase()}: ${sign}${t.amount} TL - ${t.description}`);
    });

    console.log("----------------------");
    console.log(`Net Kasa Durumu: ${bakiye} TL`);
}

async function handleAddTodo() {
    rl.question("Görev nedir?: ", async (task) => {
        await addTodo(task);
        console.log("✅ Görev eklendi.");
        ask();
    });
}

async function handleListTodos() {
    const data = await loadData();
    console.log("\n--- To-Do Listesi ---");
    if (data.todos.length === 0) {
        console.log("Görev bulunmuyor.");
    } else {
        data.todos.forEach((t, index) => {
            const status = t.completed ? "[x]" : "[ ]";
            console.log(`${index + 1}. ${status} ${t.task}`);
        });
    }
}

// Uygulamayı başlat
console.log("Peng Muhasebe Başlatılıyor...");
ask();
