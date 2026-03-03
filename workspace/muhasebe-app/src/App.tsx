import { useState, useEffect } from 'react';
import { Wallet, ListTodo, Plus, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'gelir' | 'gider';
  amount: number;
  description: string;
  date: string;
}

interface Todo {
  id: string;
  task: string;
  completed: boolean;
  createdAt: string;
}

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);

  // Form states
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'gelir' | 'gider'>('gelir');
  const [todoText, setTodoText] = useState('');

  // Local Storage'dan veri çek
  useEffect(() => {
    const savedT = localStorage.getItem('peng_muhasebe_txn');
    const savedTodo = localStorage.getItem('peng_muhasebe_todos');
    if (savedT) setTransactions(JSON.parse(savedT));
    if (savedTodo) setTodos(JSON.parse(savedTodo));
  }, []);

  // Veri değiştikçe Local Storage'a kaydet
  useEffect(() => {
    localStorage.setItem('peng_muhasebe_txn', JSON.stringify(transactions));
    localStorage.setItem('peng_muhasebe_todos', JSON.stringify(todos));
  }, [transactions, todos]);

  const addTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !desc) return;

    const newTxn: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount: parseFloat(amount),
      description: desc,
      date: new Date().toISOString()
    };

    setTransactions(prev => [newTxn, ...prev]);
    setAmount('');
    setDesc('');
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoText) return;

    const newTodo: Todo = {
      id: Math.random().toString(36).substr(2, 9),
      task: todoText,
      completed: false,
      createdAt: new Date().toISOString()
    };

    setTodos(prev => [newTodo, ...prev]);
    setTodoText('');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const bakiye = transactions.reduce((acc, curr) => {
    return curr.type === 'gelir' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  return (
    <div className="app-container">
      <h1 className="header-title">
        <Wallet size={36} color="#38bdf8" />
        Peng Muhasebe & To-Do
      </h1>

      {/* MUHASEBE PANELİ */}
      <div className="glass-panel">
        <h2>Kasa Durumu</h2>
        <div className={`kasa-net ${bakiye >= 0 ? 'positive' : 'negative'}`}>
          {bakiye.toLocaleString('tr-TR')} ₺
        </div>

        <form onSubmit={addTransaction}>
          <div className="form-group">
            <select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="gelir">Gelir / Alacak</option>
              <option value="gider">Gider / Borç</option>
            </select>
          </div>
          <div className="form-group">
            <input
              type="number"
              placeholder="Miktar (₺)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Açıklama"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              required
            />
          </div>
          <button type="submit">
            <Plus size={18} /> Ekle
          </button>
        </form>

        <h3 style={{ marginTop: '2rem' }}>Son İşlemler</h3>
        <ul className="transaction-list">
          {transactions.map(t => (
            <li key={t.id} className="transaction-item">
              <div>
                <span className={`badge ${t.type}`}>{t.type}</span>
                <span style={{ marginLeft: '1rem', color: '#e2e8f0' }}>{t.description}</span>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {new Date(t.date).toLocaleDateString('tr-TR')}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className={`amount ${t.type === 'gelir' ? 'positive' : 'negative'}`}>
                  {t.type === 'gelir' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {t.amount.toLocaleString('tr-TR')} ₺
                </span>
                <button className="delete-btn" onClick={() => deleteTransaction(t.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
          {transactions.length === 0 && <li style={{ textAlign: 'center', color: '#64748b' }}>Henüz işlem yok.</li>}
        </ul>
      </div>

      {/* TO-DO PANELİ */}
      <div className="glass-panel">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ListTodo size={28} color="#818cf8" />
          Yapılacaklar
        </h2>

        <form onSubmit={addTodo} style={{ marginBottom: '2rem' }}>
          <div className="form-group" style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Yeni görev..."
              value={todoText}
              onChange={e => setTodoText(e.target.value)}
            />
            <button type="submit" style={{ width: 'auto' }}>Ekle</button>
          </div>
        </form>

        <ul className="todo-list">
          {todos.map(t => (
            <li
              key={t.id}
              className={`todo-item ${t.completed ? 'completed' : ''}`}
              onClick={() => toggleTodo(t.id)}
            >
              <span>{t.task}</span>
              <button className="delete-btn" onClick={(e) => deleteTodo(e, t.id)}>
                <Trash2 size={18} />
              </button>
            </li>
          ))}
          {todos.length === 0 && <li style={{ textAlign: 'center', color: '#64748b' }}>Tüm görevler tamamlandı!</li>}
        </ul>
      </div>
    </div>
  );
}

export default App;
