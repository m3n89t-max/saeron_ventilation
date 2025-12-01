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

      // 판매 내역
      sales: [],

      // 월별 마감 내역
      monthlyClosings: [],

      // 견적 내역
      quotes: [],

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

      // 판매 추가
      addSale: (sale) => {
        const product = get().products.find((p) => p.id === sale.productId);
        
        // 재고 확인
        if (!product || product.quantity < sale.quantity) {
          return { success: false, message: '재고가 부족합니다!' };
        }

        // 재고 차감
        get().updateProduct(sale.productId, {
          quantity: product.quantity - sale.quantity,
        });

        // 판매 내역 추가
        const newSale = {
          ...sale,
          id: Date.now(),
          date: new Date().toISOString(),
          productName: product.name,
          unitPrice: sale.unitPrice || product.price,
          totalPrice: sale.totalAmount || (sale.quantity * (sale.unitPrice || product.price)),
          paidAmount: sale.paidAmount || 0,
        };

        set((state) => ({
          sales: [newSale, ...state.sales],
        }));

        // 거래 내역에도 출고로 기록
        const newTransaction = {
          id: Date.now() + 1,
          productId: sale.productId,
          type: 'out',
          quantity: sale.quantity,
          date: new Date().toISOString(),
          note: `판매 - ${sale.customer}`,
          user: sale.user,
        };

        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }));

        return { success: true, message: '판매가 완료되었습니다!' };
      },

      // 판매 삭제
      deleteSale: (id) => {
        set((state) => ({
          sales: state.sales.filter((s) => s.id !== id),
        }));
      },

      // 판매 총액 계산
      getTotalSales: () => {
        return get().sales.reduce((sum, s) => sum + s.totalPrice, 0);
      },

      // 기간별 판매 조회
      getSalesByDateRange: (startDate, endDate) => {
        return get().sales.filter((s) => {
          const saleDate = new Date(s.date);
          return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
        });
      },

      // 월별 마감 생성
      createMonthlyClosing: (year, month) => {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        
        // 해당 월의 판매 내역 조회
        const monthlySales = get().sales.filter((s) => {
          const saleDate = new Date(s.date);
          return saleDate >= startDate && saleDate <= endDate;
        });

        // 이미 마감된 월인지 확인
        const existingClosing = get().monthlyClosings.find(
          (c) => c.year === year && c.month === month
        );

        if (existingClosing) {
          return { success: false, message: '이미 마감된 월입니다.' };
        }

        // 마감 데이터 계산
        const totalSales = monthlySales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
        const totalPaid = monthlySales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
        const totalUnpaid = totalSales - totalPaid;
        const salesCount = monthlySales.length;

        // 카테고리별 매출
        const categoryBreakdown = {};
        monthlySales.forEach((sale) => {
          const product = get().products.find((p) => p.id === sale.productId);
          if (product) {
            const category = product.category;
            if (!categoryBreakdown[category]) {
              categoryBreakdown[category] = {
                sales: 0,
                quantity: 0,
                paid: 0,
              };
            }
            categoryBreakdown[category].sales += sale.totalPrice || 0;
            categoryBreakdown[category].quantity += sale.quantity || 0;
            categoryBreakdown[category].paid += sale.paidAmount || 0;
          }
        });

        // 수금 상태별 분류
        const fullyPaid = monthlySales.filter((s) => 
          (s.totalPrice || 0) === (s.paidAmount || 0)
        ).length;
        const partiallyPaid = monthlySales.filter((s) => 
          (s.paidAmount || 0) > 0 && (s.paidAmount || 0) < (s.totalPrice || 0)
        ).length;
        const unpaid = monthlySales.filter((s) => 
          (s.paidAmount || 0) === 0
        ).length;

        const newClosing = {
          id: Date.now(),
          year,
          month,
          closingDate: new Date().toISOString(),
          totalSales,
          totalPaid,
          totalUnpaid,
          salesCount,
          categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
            category,
            ...data,
          })),
          paymentStatus: {
            fullyPaid,
            partiallyPaid,
            unpaid,
          },
          salesData: monthlySales, // 마감 시점의 판매 데이터 저장
        };

        set((state) => ({
          monthlyClosings: [...state.monthlyClosings, newClosing],
        }));

        return { success: true, message: '월별 마감이 완료되었습니다.', closing: newClosing };
      },

      // 월별 마감 조회
      getMonthlyClosing: (year, month) => {
        return get().monthlyClosings.find(
          (c) => c.year === year && c.month === month
        );
      },

      // 월별 마감 삭제
      deleteMonthlyClosing: (id) => {
        set((state) => ({
          monthlyClosings: state.monthlyClosings.filter((c) => c.id !== id),
        }));
      },

      // 모든 월별 마감 조회
      getAllMonthlyClosings: () => {
        return get().monthlyClosings.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
      },

      // 견적 추가
      addQuote: (quote) => {
        const newQuote = {
          ...quote,
          id: Date.now(),
          createdDate: new Date().toISOString(),
        };
        set((state) => ({
          quotes: [newQuote, ...state.quotes],
        }));
        return { success: true, message: '견적이 등록되었습니다!' };
      },

      // 견적 수정
      updateQuote: (id, updates) => {
        set((state) => ({
          quotes: state.quotes.map((q) =>
            q.id === id
              ? { ...q, ...updates, updatedDate: new Date().toISOString() }
              : q
          ),
        }));
        return { success: true, message: '견적이 수정되었습니다!' };
      },

      // 견적 삭제
      deleteQuote: (id) => {
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        }));
      },

      // 견적 총액 계산
      getTotalQuotes: () => {
        return get().quotes.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
      },

      // 성사된 견적 총액
      getSuccessQuotesTotal: () => {
        return get().quotes
          .filter((q) => q.status === 'success')
          .reduce((sum, q) => sum + (q.totalAmount || 0), 0);
      },

      // 가망고객 견적 조회
      getProspectQuotes: () => {
        return get().quotes.filter((q) => q.isProspect === true);
      },

      // 상태별 견적 조회
      getQuotesByStatus: (status) => {
        return get().quotes.filter((q) => q.status === status);
      },

      // 기간별 견적 조회
      getQuotesByDateRange: (startDate, endDate) => {
        return get().quotes.filter((q) => {
          const quoteDate = new Date(q.createdDate);
          return quoteDate >= new Date(startDate) && quoteDate <= new Date(endDate);
        });
      },
    }),
    {
      name: 'saeron-inventory-storage',
    }
  )
);

export default useInventoryStore;
