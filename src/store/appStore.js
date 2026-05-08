import { create } from 'zustand';
import { supabase } from '../supabase';

const COLLECTIONS = [
  'products', 'transactions', 'quotes', 'salesOrders',
  'purchaseOrders', 'expenses', 'otherIncome', 'customers', 'suppliers',
  'filterCustomers', 'filterHistory',
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
  filterCustomers: [],
  filterHistory: [],

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

    // 재고 자동 출고 연동
    (o.items || []).forEach((item, idx) => {
      if (!item.productName?.trim() || !(item.quantity > 0)) return;
      const prod = get().products.find((p) => p.name.toLowerCase() === item.productName.trim().toLowerCase());
      if (!prod) return;
      const tx = { id: n.id + idx + 2000, productId: prod.id, productName: prod.name, type: 'out', quantity: item.quantity, unitPrice: item.unitPrice || 0, date: new Date().toISOString(), note: '매출 자동 연동', user: o.user || '', reference: n.orderNumber };
      set((s) => ({
        products: s.products.map((p) => p.id === prod.id ? { ...p, quantity: p.quantity - item.quantity, updatedAt: new Date().toISOString() } : p),
        transactions: [tx, ...s.transactions],
      }));
    });

    return n;
  },
  updateSalesOrder:  (id, upd) => set((s) => ({ salesOrders: s.salesOrders.map((o) => o.id === id ? { ...o, ...upd } : o) })),
  deleteSalesOrder:  (id) => set((s) => ({ salesOrders: s.salesOrders.filter((o) => o.id !== id) })),

  // ── 매입 ───────────────────────────────────────────
  addPurchaseOrder: (o) => {
    const cnt = get().purchaseOrders.length + 1;
    const n = { ...o, id: Date.now(), purchaseNumber: `PO-${new Date().getFullYear()}-${String(cnt).padStart(3, '0')}`, purchaseDate: new Date().toISOString(), status: 'ordered', paymentStatus: (o.paidAmount || 0) >= o.totalAmount ? 'paid' : (o.paidAmount || 0) > 0 ? 'partial' : 'pending' };
    set((s) => ({ purchaseOrders: [n, ...s.purchaseOrders] }));

    // 재고 자동 입고 연동
    (o.items || []).forEach((item, idx) => {
      if (!item.productName?.trim() || !(item.quantity > 0)) return;
      const name = item.productName.trim();
      let prod = get().products.find((p) => p.name.toLowerCase() === name.toLowerCase());
      if (!prod) {
        // 재고에 없는 제품이면 자동 등록
        prod = { id: n.id + idx + 1, code: `PRD-${String(n.id + idx + 1).slice(-6)}`, name, category: '기타', quantity: 0, salePrice: item.unitPrice || 0, purchasePrice: item.unitPrice || 0, minQuantity: 0, unit: '개', updatedAt: new Date().toISOString() };
        set((s) => ({ products: [...s.products, prod] }));
      }
      const tx = { id: n.id + idx + 1000, productId: prod.id, productName: prod.name, type: 'in', quantity: item.quantity, unitPrice: item.unitPrice || 0, date: new Date().toISOString(), note: '매입 자동 연동', user: o.user || '', reference: n.purchaseNumber };
      set((s) => ({
        products: s.products.map((p) => p.id === prod.id ? { ...p, quantity: p.quantity + item.quantity, updatedAt: new Date().toISOString() } : p),
        transactions: [tx, ...s.transactions],
      }));
    });

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

  // ── 필터 고객 관리 ─────────────────────────────────
  addFilterCustomer: (c) => {
    const n = { ...c, id: Date.now(), registeredAt: new Date().toISOString() };
    set((s) => ({ filterCustomers: [...s.filterCustomers, n] }));
    return n;
  },
  updateFilterCustomer: (id, upd) => set((s) => ({ filterCustomers: s.filterCustomers.map((c) => c.id === id ? { ...c, ...upd } : c) })),
  deleteFilterCustomer: (id) => set((s) => ({
    filterCustomers: s.filterCustomers.filter((c) => c.id !== id),
    filterHistory: s.filterHistory.filter((h) => h.customerId !== id),
  })),

  addFilterHistory: (h) => {
    const n = { ...h, id: Date.now() };
    set((s) => ({ filterHistory: [n, ...s.filterHistory] }));
    return n;
  },
  updateFilterHistory: (id, upd) => set((s) => ({ filterHistory: s.filterHistory.map((h) => h.id === id ? { ...h, ...upd } : h) })),
  deleteFilterHistory: (id) => set((s) => ({ filterHistory: s.filterHistory.filter((h) => h.id !== id) })),

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

  // ── 매입/매출 → 재고 일괄 동기화 (기존 데이터 소급 적용) ──────
  syncInventoryFromOrders: () => {
    const { purchaseOrders, salesOrders } = get();
    const now = Date.now();

    // 제품별 순수량 계산 (매입 합계 - 매출 합계)
    const map = {}; // key: 소문자 이름
    purchaseOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (!item.productName?.trim() || !(item.quantity > 0)) return;
        const key = item.productName.trim().toLowerCase();
        if (!map[key]) map[key] = { name: item.productName.trim(), qty: 0, price: 0 };
        map[key].qty += item.quantity;
        map[key].price = item.unitPrice || map[key].price;
      });
    });
    salesOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (!item.productName?.trim() || !(item.quantity > 0)) return;
        const key = item.productName.trim().toLowerCase();
        if (map[key]) map[key].qty -= item.quantity;
      });
    });

    // 기존 products와 merge
    const existing = get().products;
    const updated = [...existing];
    Object.values(map).forEach((entry, idx) => {
      const found = updated.find((p) => p.name.toLowerCase() === entry.name.toLowerCase());
      if (found) {
        const i = updated.findIndex((p) => p.id === found.id);
        updated[i] = { ...found, quantity: entry.qty, updatedAt: new Date().toISOString() };
      } else {
        updated.push({ id: now + idx + 9000, code: `PRD-${String(now + idx).slice(-6)}`, name: entry.name, category: '기타', quantity: entry.qty, salePrice: entry.price, purchasePrice: entry.price, minQuantity: 0, unit: '개', updatedAt: new Date().toISOString() });
      }
    });
    set({ products: updated });
  },

  exportData: () => {
    const s = get();
    return { products: s.products, transactions: s.transactions, quotes: s.quotes, salesOrders: s.salesOrders, purchaseOrders: s.purchaseOrders, expenses: s.expenses, otherIncome: s.otherIncome, customers: s.customers, suppliers: s.suppliers, exportedAt: new Date().toISOString() };
  },

  resetAll: () => {
    set({ products: [], transactions: [], quotes: [], salesOrders: [], purchaseOrders: [], expenses: [], otherIncome: [], customers: [], suppliers: [], filterCustomers: [], filterHistory: [] });
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
