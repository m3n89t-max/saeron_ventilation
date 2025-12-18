import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSalesStore = create(
  persist(
    (set, get) => ({
      // 고객 데이터
      customers: [
        {
          id: 1,
          code: 'CST-001',
          name: '대성건설 주식회사',
          contact: '02-1234-5678',
          email: 'contact@daesung.co.kr',
          address: '서울시 강남구 테헤란로 123',
          manager: '김대성',
          managerPhone: '010-1234-5678',
          customerType: 'B2B',
          totalPurchase: 15000000,
          registeredDate: new Date('2024-01-15').toISOString(),
        },
        {
          id: 2,
          code: 'CST-002',
          name: '한국산업 주식회사',
          contact: '031-5678-9012',
          email: 'info@hanguksanup.com',
          address: '경기도 성남시 분당구 판교로 456',
          manager: '이한국',
          managerPhone: '010-2345-6789',
          customerType: 'B2B',
          totalPurchase: 8500000,
          registeredDate: new Date('2024-02-20').toISOString(),
        },
        {
          id: 3,
          code: 'CST-003',
          name: '서울설비공사',
          contact: '02-9876-5432',
          email: 'seoul@facility.kr',
          address: '서울시 영등포구 국회대로 789',
          manager: '박서울',
          managerPhone: '010-3456-7890',
          customerType: 'B2B',
          totalPurchase: 5200000,
          registeredDate: new Date('2024-03-10').toISOString(),
        },
        {
          id: 4,
          code: 'CST-004',
          name: '홍길동',
          contact: '010-9999-8888',
          email: 'hong@example.com',
          address: '서울시 중구 남대문로 100',
          manager: '홍길동',
          managerPhone: '010-9999-8888',
          customerType: 'B2C',
          totalPurchase: 850000,
          registeredDate: new Date('2024-04-05').toISOString(),
        },
      ],

      // 주문 데이터
      orders: [
        {
          id: 1,
          orderNumber: 'ORD-2024-001',
          customerId: 1,
          customerName: '대성건설 주식회사',
          orderDate: new Date('2024-11-20').toISOString(),
          deliveryDate: new Date('2024-11-25').toISOString(),
          status: 'delivered',
          items: [
            { productId: 1, productName: '산업용 복합환풍기 (300mm)', quantity: 10, price: 450000, total: 4500000 },
            { productId: 3, productName: '열회수형 환기시스템', quantity: 2, price: 2500000, total: 5000000 },
          ],
          totalAmount: 9500000,
          paidAmount: 9500000,
          paymentStatus: 'paid',
          paymentMethod: '계좌이체',
          shippingAddress: '서울시 강남구 테헤란로 123 현장사무소',
          note: '현장 직배송 요청',
          user: '김영업',
        },
        {
          id: 2,
          orderNumber: 'ORD-2024-002',
          customerId: 2,
          customerName: '한국산업 주식회사',
          orderDate: new Date('2024-11-25').toISOString(),
          deliveryDate: new Date('2024-11-30').toISOString(),
          status: 'processing',
          items: [
            { productId: 2, productName: '벽부형 일반환풍기 (250mm)', quantity: 20, price: 180000, total: 3600000 },
            { productId: 7, productName: '환풍기 제어시스템', quantity: 5, price: 350000, total: 1750000 },
          ],
          totalAmount: 5350000,
          paidAmount: 0,
          paymentStatus: 'pending',
          paymentMethod: '세금계산서',
          shippingAddress: '경기도 성남시 분당구 판교로 456',
          note: '설치 지원 필요',
          user: '이영업',
        },
        {
          id: 3,
          orderNumber: 'ORD-2024-003',
          customerId: 3,
          customerName: '서울설비공사',
          orderDate: new Date('2024-11-28').toISOString(),
          deliveryDate: new Date('2024-12-03').toISOString(),
          status: 'pending',
          items: [
            { productId: 4, productName: '천장형 복합환풍기 (400mm)', quantity: 8, price: 550000, total: 4400000 },
          ],
          totalAmount: 4400000,
          paidAmount: 2000000,
          paymentStatus: 'partial',
          paymentMethod: '계좌이체',
          shippingAddress: '서울시 영등포구 국회대로 789',
          note: '긴급 주문 - 부분수금 2,000,000원 (잔액 2,400,000원)',
          user: '박영업',
        },
      ],

      // 판매 통계
      salesStats: {
        todaySales: 0,
        weeklySales: 9500000,
        monthlySales: 19250000,
        totalOrders: 3,
        pendingOrders: 1,
        processingOrders: 1,
        deliveredOrders: 1,
      },

      // 고객 유형
      customerTypes: ['B2B', 'B2C'],

      // 주문 상태
      orderStatuses: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],

      // 결제 상태
      paymentStatuses: ['pending', 'paid', 'partial', 'refund'],

      // 고객 추가
      addCustomer: (customer) => {
        const newCustomer = {
          ...customer,
          id: Date.now(),
          code: `CST-${String(get().customers.length + 1).padStart(3, '0')}`,
          totalPurchase: 0,
          registeredDate: new Date().toISOString(),
        };
        set((state) => ({
          customers: [...state.customers, newCustomer],
        }));
        return newCustomer;
      },

      // 고객 수정
      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      // 고객 삭제
      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));
      },

      // 주문 추가
      addOrder: (order) => {
        const newOrder = {
          ...order,
          id: Date.now(),
          orderNumber: `ORD-${new Date().getFullYear()}-${String(get().orders.length + 1).padStart(3, '0')}`,
          orderDate: new Date().toISOString(),
          status: 'pending',
          paidAmount: order.paidAmount || 0,
        };
        
        // 고객의 총 구매액 업데이트
        const customer = get().customers.find((c) => c.id === order.customerId);
        if (customer) {
          get().updateCustomer(order.customerId, {
            totalPurchase: customer.totalPurchase + order.totalAmount,
          });
        }

        set((state) => ({
          orders: [newOrder, ...state.orders],
        }));
        
        // 통계 업데이트
        get().updateSalesStats();
        
        return newOrder;
      },

      // 주문 수정
      updateOrder: (id, updates) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
        }));
        get().updateSalesStats();
      },

      // 주문 삭제
      deleteOrder: (id) => {
        const order = get().orders.find((o) => o.id === id);
        
        if (order) {
          // 고객의 총 구매액 차감
          const customer = get().customers.find((c) => c.id === order.customerId);
          if (customer && order.paymentStatus === 'paid') {
            get().updateCustomer(order.customerId, {
              totalPurchase: customer.totalPurchase - order.totalAmount,
            });
          }
        }

        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        }));
        
        get().updateSalesStats();
      },

      // 주문 상태 변경
      updateOrderStatus: (id, status) => {
        get().updateOrder(id, { status });
      },

      // 결제 상태 변경
      updatePaymentStatus: (id, paymentStatus) => {
        get().updateOrder(id, { paymentStatus });
      },

      // 판매 통계 업데이트
      updateSalesStats: () => {
        const orders = get().orders;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const todaySales = orders
          .filter((o) => new Date(o.orderDate) >= todayStart && o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + o.totalAmount, 0);

        const weeklySales = orders
          .filter((o) => new Date(o.orderDate) >= weekStart && o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + o.totalAmount, 0);

        const monthlySales = orders
          .filter((o) => new Date(o.orderDate) >= monthStart && o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + o.totalAmount, 0);

        const pendingOrders = orders.filter((o) => o.status === 'pending').length;
        const processingOrders = orders.filter((o) => o.status === 'processing').length;
        const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

        set({
          salesStats: {
            todaySales,
            weeklySales,
            monthlySales,
            totalOrders: orders.length,
            pendingOrders,
            processingOrders,
            deliveredOrders,
          },
        });
      },

      // 고객별 주문 조회
      getOrdersByCustomer: (customerId) => {
        return get().orders.filter((o) => o.customerId === customerId);
      },

      // 상위 고객 조회
      getTopCustomers: (limit = 10) => {
        return [...get().customers]
          .sort((a, b) => b.totalPurchase - a.totalPurchase)
          .slice(0, limit);
      },

      // 최근 주문 조회
      getRecentOrders: (limit = 10) => {
        return [...get().orders]
          .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
          .slice(0, limit);
      },

      // 총 매출액 계산
      getTotalRevenue: () => {
        return get().orders
          .filter((o) => o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + o.totalAmount, 0);
      },
    }),
    {
      name: 'saeron-sales-storage',
    }
  )
);

export default useSalesStore;
