import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useInventoryStore = create(
  persist(
    (set, get) => ({
      // 재고 데이터
      products: [
        {
          id: 1,
          code: 'PRD-001',
          name: '산업용 복합환풍기 (300mm)',
          category: '복합환풍기',
          quantity: 45,
          minQuantity: 10,
          price: 450000,
          location: '창고A-101',
          supplier: '(주)새론환풍기',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 2,
          code: 'PRD-002',
          name: '벽부형 일반환풍기 (250mm)',
          category: '일반환풍기',
          quantity: 120,
          minQuantity: 30,
          price: 180000,
          location: '창고A-205',
          supplier: '(주)새론환풍기',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 3,
          code: 'PRD-003',
          name: '열회수형 환기시스템',
          category: '환기시스템',
          quantity: 15,
          minQuantity: 5,
          price: 2500000,
          location: '창고B-103',
          supplier: '(주)새론환풍기',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 4,
          code: 'PRD-004',
          name: '천장형 복합환풍기 (400mm)',
          category: '복합환풍기',
          quantity: 32,
          minQuantity: 15,
          price: 550000,
          location: '창고A-102',
          supplier: '(주)새론환풍기',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 5,
          code: 'PRD-005',
          name: '창문형 일반환풍기 (200mm)',
          category: '일반환풍기',
          quantity: 85,
          minQuantity: 20,
          price: 120000,
          location: '창고A-206',
          supplier: '(주)새론환풍기',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 6,
          code: 'PRD-006',
          name: '덕트형 환기시스템',
          category: '환기시스템',
          quantity: 22,
          minQuantity: 10,
          price: 1800000,
          location: '창고B-104',
          supplier: '(주)새론환풍기',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 7,
          code: 'PRD-007',
          name: '환풍기 제어시스템',
          category: '전자제품',
          quantity: 40,
          minQuantity: 15,
          price: 350000,
          location: '창고C-101',
          supplier: '(주)새론전자',
          lastUpdated: new Date().toISOString(),
        },
      ],

      // 거래 내역
      transactions: [
        {
          id: 1,
          productId: 1,
          type: 'in',
          quantity: 20,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          note: '공장 생산 입고',
          user: '김재고',
        },
        {
          id: 2,
          productId: 2,
          type: 'out',
          quantity: 15,
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          note: '거래처 A 출고',
          user: '이출고',
        },
        {
          id: 3,
          productId: 3,
          type: 'out',
          quantity: 5,
          date: new Date().toISOString(),
          note: '시공업체 B 출고',
          user: '박관리',
        },
        {
          id: 4,
          productId: 4,
          type: 'in',
          quantity: 10,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          note: '공장 생산 입고',
          user: '김재고',
        },
      ],

      // 카테고리 목록
      categories: ['복합환풍기', '일반환풍기', '환기시스템', '전자제품'],

      // 재고 추가
      addProduct: (product) => {
        const newProduct = {
          ...product,
          id: Date.now(),
          lastUpdated: new Date().toISOString(),
        };
        set((state) => ({
          products: [...state.products, newProduct],
        }));
      },

      // 재고 수정
      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? { ...p, ...updates, lastUpdated: new Date().toISOString() }
              : p
          ),
        }));
      },

      // 재고 삭제
      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
      },

      // 입고 처리
      addStock: (productId, quantity, note, user) => {
        const product = get().products.find((p) => p.id === productId);
        if (product) {
          get().updateProduct(productId, {
            quantity: product.quantity + quantity,
          });
          
          const newTransaction = {
            id: Date.now(),
            productId,
            type: 'in',
            quantity,
            date: new Date().toISOString(),
            note,
            user,
          };
          
          set((state) => ({
            transactions: [newTransaction, ...state.transactions],
          }));
        }
      },

      // 출고 처리
      removeStock: (productId, quantity, note, user) => {
        const product = get().products.find((p) => p.id === productId);
        if (product && product.quantity >= quantity) {
          get().updateProduct(productId, {
            quantity: product.quantity - quantity,
          });
          
          const newTransaction = {
            id: Date.now(),
            productId,
            type: 'out',
            quantity,
            date: new Date().toISOString(),
            note,
            user,
          };
          
          set((state) => ({
            transactions: [newTransaction, ...state.transactions],
          }));
          
          return true;
        }
        return false;
      },

      // 부족 재고 조회
      getLowStockProducts: () => {
        return get().products.filter((p) => p.quantity <= p.minQuantity);
      },

      // 카테고리별 재고 조회
      getProductsByCategory: (category) => {
        return get().products.filter((p) => p.category === category);
      },

      // 재고 총액 계산
      getTotalValue: () => {
        return get().products.reduce(
          (sum, p) => sum + p.quantity * p.price,
          0
        );
      },
    }),
    {
      name: 'saeron-inventory-storage',
    }
  )
);

export default useInventoryStore;
