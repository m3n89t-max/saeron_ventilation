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
          name: '노트북 (LG그램 15인치)',
          category: '전자제품',
          quantity: 45,
          minQuantity: 10,
          price: 1500000,
          location: '창고A-101',
          supplier: '(주)엘지전자',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 2,
          code: 'PRD-002',
          name: '무선마우스',
          category: '주변기기',
          quantity: 120,
          minQuantity: 30,
          price: 25000,
          location: '창고A-205',
          supplier: '로지텍코리아',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 3,
          code: 'PRD-003',
          name: 'USB 메모리 (64GB)',
          category: '저장장치',
          quantity: 8,
          minQuantity: 20,
          price: 15000,
          location: '창고B-103',
          supplier: '삼성전자',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 4,
          code: 'PRD-004',
          name: '모니터 (27인치)',
          category: '전자제품',
          quantity: 32,
          minQuantity: 15,
          price: 350000,
          location: '창고A-102',
          supplier: '삼성전자',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 5,
          code: 'PRD-005',
          name: '키보드 (기계식)',
          category: '주변기기',
          quantity: 55,
          minQuantity: 20,
          price: 120000,
          location: '창고A-206',
          supplier: '레오폴드',
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
          note: '정기 입고',
          user: '김재고',
        },
        {
          id: 2,
          productId: 2,
          type: 'out',
          quantity: 15,
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          note: '영업팀 출고',
          user: '이출고',
        },
        {
          id: 3,
          productId: 3,
          type: 'out',
          quantity: 12,
          date: new Date().toISOString(),
          note: '개발팀 출고',
          user: '박관리',
        },
      ],

      // 카테고리 목록
      categories: ['전자제품', '주변기기', '저장장치', '기타'],

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
