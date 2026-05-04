import { create } from 'zustand';
import { supabase } from '../supabase';

const COLLECTIONS = [
  'products', 'transactions', 'quotes', 'salesOrders',
  'purchaseOrders', 'expenses', 'otherIncome', 'customers', 'suppliers',
];

// Supabase에서 받은 업데이트인지 표시 (무한루프 방지)
let supabaseSyncing = false;
const saveTimers = {};

const scheduleWrite = (name, data) => {
  clearTimeout(saveTimers[name]);
  saveTimers[name] = setTimeout(() => {
    supabase
      .from('app_data')
      .upsert({ collection: name, items: data }, { onConflict: 'collection' })
      .then(({ error }) => { if (error) console.error(`Supabase write error [${name}]:`, error); });
  }, 400);
};

const useAppStore = create((set, get) => ({
  // ── 데이터 ──────────────────────────────────────────
  products: [],
  transactions: [],
  quotes: [],
  salesOrders: [],
  purchaseOrders: [],
  expenses: [],
  otherIncome: [],
  customers: [],
  suppliers: [],

  // ── 메타 ────────────────────────────────────────────
  _loaded: false,
  productCategories:     ['복합환풍기', '일반환풍기', '환기시스템', '제어시스템', '부자재'],
  expenseCategories:     ['인건비', '임대료', '차량유지비', '광고홍보비', '통신비', '공과금', '소모품', '기타'],
  otherIncomeCategories: ['설치공사', '유지보수', '기타'],

  // ── Supabase 동기화 시작 ────────────────────────────
  initSync: async () => {
    // Supabase에서 전체 데이터 읽어 state에 반영
    const loadAll = async () => {
      const { data, error } = await supabase.from('app_data').select('*');
      if (error) { console.error('Supabase 로드 오류:', error); return; }
      if (!data) return;
      const update = {};
      COLLECTIONS.forEach((name) => {
        const row = data.find((r) => r.collection === name);
        update[name] = row ? (row.items || []) : [];
      });
      supabaseSyncing = true;
      set({ ...update, _loaded: true });
      supabaseSyncing = false;
    };

    await loadAll();

    // 3초마다 폴링 동기화
    const pollTimer = setInterval(loadAll, 3000);

    return () => {
      clearInterval(pollTimer);
    };
  },

  // ── 제품/재고 ──────────────────────────────────────
  addProduct: (p) => {
    const n = { ...p, id: Date.now(), updatedAt: new Date().toISOString() };
    set((s) => ({ products: [...s.products, n] }));
  },
  updateProduct: (id, upd) => {
    set((s) => ({
      products: s.products.map((p) =>
        p.id === id ? { ...p, ...upd, updatedAt: new Date().toISOString() } : p
      ),
    }));
  },
  deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

  addStockIn: (productId, quantity, unitPrice, note, user, reference = '') => {
    const p = get().products.find((x) => x.id === productId);
    if (!p) return false;
    get().updateProduct(productId, { quantity: p.quantity + quantity });
    const tx = { id: Date.now(), productId, productName: p.name, type: 'in', quantity, unitPrice, date: new Date().toISOString(), note, user, reference };
    set((s) => ({ transactions: [tx, ...s.transactions] }));
    return true;
  },
  addStockOut: (productId, quantity, unitPrice, note, user, reference = '') => {
    const p = get().products.find((x) => x.id === productId);
    if (!p || p.quantity < quantity) return false;
    get().updateProduct(productId, { quantity: p.quantity - quantity });
    const tx = { id: Date.now(), productId, productName: p.name, type: 'out', quantity, unitPrice, date: new Date().toISOString(), note, user, reference };
    set((s) => ({ transactions: [tx, ...s.transactions] }));
    return true;
  },

  // ── 견적 ───────────────────────────────────────────
  addQuote: (q) => {
    const cnt = get().quotes.length + 1;
    const n = { ...q, id: Date.now(), quoteNumber: `QT-${new Date().getFullYear()}-${String(cnt).padStart(3, '0')}`, createdAt: new Date().toISOString(), status: q.status || 'pending', convertedOrderId: null };
    set((s) => ({ quotes: [n, ...s.quotes] }));
    return n;
  },
  updateQuote:  (id, upd) => set((s) => ({ quotes: s.quotes.map((q) => q.id === id ? { ...q, ...upd } : q) })),
  deleteQuote:  (id) => set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) })),

  // ── 매출 ───────────────────────────────────────────
  addSalesOrder: (o) => {
    const cnt = get().salesOrders.length + 1;
    const n = { ...o, id: Date.now(), orderNumber: `SO-${new Date().getFullYear()}-${String(cnt).padStart(3, '0')}`, orderDate: new Date().toISOString(), status: 'pending', paymentStatus: (o.paidAmount || 0) >= o.totalAmount ? 'paid' : (o.paidAmount || 0) > 0 ? 'partial' : 'pending' };
    set((s) => ({ salesOrders: [n, ...s.salesOrders] }));
    return n;
  },
  updateSalesOrder:  (id, upd) => set((s) => ({ salesOrders: s.salesOrders.map((o) => o.id === id ? { ...o, ...upd } : o) })),
  deleteSalesOrder:  (id) => set((s) => ({ salesOrders: s.salesOrders.filter((o) => o.id !== id) })),

  // ── 매입 ───────────────────────────────────────────
  addPurchaseOrder: (o) => {
    const cnt = get().purchaseOrders.length + 1;
    const n = { ...o, id: Date.now(), purchaseNumber: `PO-${new Date().getFullYear()}-${String(cnt).padStart(3, '0')}`, purchaseDate: new Date().toISOString(), status: 'ordered', paymentStatus: (o.paidAmount || 0) >= o.totalAmount ? 'paid' : (o.paidAmount || 0) > 0 ? 'partial' : 'pending' };
    set((s) => ({ purchaseOrders: [n, ...s.purchaseOrders] }));
    return n;
  },
  updatePurchaseOrder:  (id, upd) => set((s) => ({ purchaseOrders: s.purchaseOrders.map((o) => o.id === id ? { ...o, ...upd } : o) })),
  deletePurchaseOrder:  (id) => set((s) => ({ purchaseOrders: s.purchaseOrders.filter((o) => o.id !== id) })),

  // ── 지출/수입 ──────────────────────────────────────
  addExpense:        (e) => { set((s) => ({ expenses:    [{ ...e, id: Date.now() }, ...s.expenses]    })); },
  deleteExpense:     (id) => set((s) => ({ expenses:    s.expenses.filter((e) => e.id !== id)         })),
  addOtherIncome:    (i) => { set((s) => ({ otherIncome: [{ ...i, id: Date.now() }, ...s.otherIncome] })); },
  deleteOtherIncome: (id) => set((s) => ({ otherIncome: s.otherIncome.filter((i) => i.id !== id)      })),

  // ── 거래처/공급업체 ────────────────────────────────
  addCustomer: (c) => {
    const cnt = get().customers.length + 1;
    const n = { ...c, id: Date.now(), code: `CST-${String(cnt).padStart(3, '0')}`, totalPurchase: 0, registeredAt: new Date().toISOString() };
    set((s) => ({ customers: [...s.customers, n] }));
    return n;
  },
  updateCustomer: (id, upd) => set((s) => ({ customers: s.customers.map((c) => c.id === id ? { ...c, ...upd } : c) })),
  deleteCustomer: (id) => set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

  addSupplier: (sup) => {
    const cnt = get().suppliers.length + 1;
    const n = { ...sup, id: Date.now(), code: `SUP-${String(cnt).padStart(3, '0')}`, registeredAt: new Date().toISOString() };
    set((s) => ({ suppliers: [...s.suppliers, n] }));
    return n;
  },
  deleteSupplier: (id) => set((s) => ({ suppliers: s.suppliers.filter((s2) => s2.id !== id) })),

  // ── 계산 헬퍼 ─────────────────────────────────────
  getLowStockProducts:      () => get().products.filter((p) => p.quantity <= p.minQuantity),
  getTotalInventoryValue:   () => get().products.reduce((s, p) => s + p.quantity * p.salePrice, 0),
  getTotalUnpaidReceivable: () => get().salesOrders.reduce((s, o) => s + (o.totalAmount - o.paidAmount), 0),
  getTotalUnpaidPayable:    () => get().purchaseOrders.reduce((s, o) => s + (o.totalAmount - o.paidAmount), 0),

  getCalculatedBankBalance: () => {
    const s = get();
    const income  = s.salesOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0)
                  + s.otherIncome.reduce((sum, i) => sum + (i.amount  || 0), 0);
    const expense = s.purchaseOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0)
                  + s.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    return income - expense;
  },

  getMonthSalesRevenue: (year, month) => {
    const s = new Date(year, month - 1, 1), e = new Date(year, month, 0, 23, 59, 59);
    return get().salesOrders.filter((o) => { const d = new Date(o.orderDate); return d >= s && d <= e; }).reduce((sum, o) => sum + o.totalAmount, 0)
         + get().otherIncome.filter((i) => { const d = new Date(i.date);      return d >= s && d <= e; }).reduce((sum, i) => sum + i.amount, 0);
  },
  getMonthPurchaseCost: (year, month) => {
    const s = new Date(year, month - 1, 1), e = new Date(year, month, 0, 23, 59, 59);
    return get().purchaseOrders.filter((o) => { const d = new Date(o.purchaseDate); return d >= s && d <= e; }).reduce((sum, o) => sum + o.totalAmount, 0);
  },
  getMonthOpExpense: (year, month) => {
    const s = new Date(year, month - 1, 1), e = new Date(year, month, 0, 23, 59, 59);
    return get().expenses.filter((e2) => { const d = new Date(e2.date); return d >= s && d <= e; }).reduce((sum, e2) => sum + e2.amount, 0);
  },

  exportData: () => {
    const s = get();
    return { products: s.products, transactions: s.transactions, quotes: s.quotes, salesOrders: s.salesOrders, purchaseOrders: s.purchaseOrders, expenses: s.expenses, otherIncome: s.otherIncome, customers: s.customers, suppliers: s.suppliers, exportedAt: new Date().toISOString() };
  },

  resetAll: () => {
    set({ products: [], transactions: [], quotes: [], salesOrders: [], purchaseOrders: [], expenses: [], otherIncome: [], customers: [], suppliers: [] });
  },
}));

// 상태 변경 감지 → Supabase에 자동 저장 (Supabase에서 받은 업데이트는 제외)
useAppStore.subscribe((state, prevState) => {
  if (supabaseSyncing || !state._loaded) return;
  for (const name of COLLECTIONS) {
    if (state[name] !== prevState[name]) {
      scheduleWrite(name, state[name]);
    }
  }
});

export default useAppStore;
