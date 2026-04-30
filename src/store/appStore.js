import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();
const mo = (m, day = 15) => { const d = new Date(); d.setMonth(d.getMonth() - m); d.setDate(day); return d.toISOString(); };

const PRODUCTS = [
  { id: 1, code: 'FAN-001', name: '산업용 복합환풍기 300mm', category: '복합환풍기', quantity: 45, minQuantity: 10, purchasePrice: 280000, salePrice: 450000, location: '창고A-101', supplier: '(주)에어텍', updatedAt: daysAgo(1) },
  { id: 2, code: 'FAN-002', name: '벽부형 일반환풍기 250mm', category: '일반환풍기', quantity: 120, minQuantity: 30, purchasePrice: 110000, salePrice: 180000, location: '창고A-205', supplier: '(주)에어텍', updatedAt: daysAgo(2) },
  { id: 3, code: 'SYS-001', name: '열회수형 환기시스템', category: '환기시스템', quantity: 8, minQuantity: 5, purchasePrice: 1600000, salePrice: 2500000, location: '창고B-103', supplier: '(주)클린에어', updatedAt: daysAgo(3) },
  { id: 4, code: 'FAN-003', name: '천장형 복합환풍기 400mm', category: '복합환풍기', quantity: 32, minQuantity: 15, purchasePrice: 340000, salePrice: 550000, location: '창고A-102', supplier: '(주)에어텍', updatedAt: daysAgo(1) },
  { id: 5, code: 'FAN-004', name: '창문형 일반환풍기 200mm', category: '일반환풍기', quantity: 85, minQuantity: 20, purchasePrice: 75000, salePrice: 120000, location: '창고A-206', supplier: '(주)에어텍', updatedAt: daysAgo(4) },
  { id: 6, code: 'SYS-002', name: '덕트형 환기시스템', category: '환기시스템', quantity: 4, minQuantity: 5, purchasePrice: 1100000, salePrice: 1800000, location: '창고B-104', supplier: '(주)클린에어', updatedAt: daysAgo(2) },
  { id: 7, code: 'CTL-001', name: '환풍기 스마트 제어시스템', category: '제어시스템', quantity: 40, minQuantity: 15, purchasePrice: 220000, salePrice: 350000, location: '창고C-101', supplier: '(주)스마트컨트롤', updatedAt: daysAgo(1) },
  { id: 8, code: 'FAN-005', name: '산업용 대형환풍기 500mm', category: '복합환풍기', quantity: 12, minQuantity: 8, purchasePrice: 520000, salePrice: 850000, location: '창고A-103', supplier: '(주)에어텍', updatedAt: daysAgo(5) },
  { id: 9, code: 'ACC-001', name: '환기 덕트 (m당)', category: '부자재', quantity: 500, minQuantity: 100, purchasePrice: 8000, salePrice: 15000, location: '창고D-101', supplier: '(주)건자재', updatedAt: daysAgo(3) },
  { id: 10, code: 'ACC-002', name: '환기구 그릴 200mm', category: '부자재', quantity: 200, minQuantity: 50, purchasePrice: 12000, salePrice: 22000, location: '창고D-102', supplier: '(주)건자재', updatedAt: daysAgo(3) },
];

const CUSTOMERS = [
  { id: 1, code: 'CST-001', name: '(주)대한건설', contact: '02-1234-5678', phone: '010-1111-2222', email: 'contact@daehan.co.kr', address: '서울시 강남구 테헤란로 123', manager: '김대한', type: 'B2B', totalPurchase: 45000000, registeredAt: mo(6) },
  { id: 2, code: 'CST-002', name: '한국산업(주)', contact: '031-5678-9012', phone: '010-2222-3333', email: 'info@hankuk.com', address: '경기도 성남시 분당구 판교로 456', manager: '이한국', type: 'B2B', totalPurchase: 28500000, registeredAt: mo(5) },
  { id: 3, code: 'CST-003', name: '서울설비공사', contact: '02-9876-5432', phone: '010-3333-4444', email: 'seoul@facility.kr', address: '서울시 영등포구 국회대로 789', manager: '박서울', type: 'B2B', totalPurchase: 15200000, registeredAt: mo(4) },
  { id: 4, code: 'CST-004', name: '(주)현대공조시스템', contact: '032-4444-5555', phone: '010-4444-5555', email: 'hvac@hyundai.com', address: '인천시 서구 검단신도시 100', manager: '최현대', type: 'B2B', totalPurchase: 32000000, registeredAt: mo(3) },
  { id: 5, code: 'CST-005', name: '대성종합건설', contact: '051-5555-6666', phone: '010-5555-6666', email: 'build@daesung.com', address: '부산시 해운대구 우동 500', manager: '정대성', type: 'B2B', totalPurchase: 18700000, registeredAt: mo(2) },
  { id: 6, code: 'CST-006', name: '홍길동', contact: '010-6666-7777', phone: '010-6666-7777', email: 'hong@personal.com', address: '서울시 중구 남대문로 100', manager: '홍길동', type: 'B2C', totalPurchase: 850000, registeredAt: mo(1) },
];

const SUPPLIERS = [
  { id: 1, code: 'SUP-001', name: '(주)에어텍', contact: '031-1111-2222', phone: '010-1234-5678', email: 'buy@airtech.co.kr', address: '경기도 안산시 단원구 공단로 100', manager: '김공급', registeredAt: mo(12) },
  { id: 2, code: 'SUP-002', name: '(주)클린에어', contact: '02-2222-3333', phone: '010-2345-6789', email: 'supply@cleanair.kr', address: '서울시 금천구 가산디지털1로 200', manager: '이클린', registeredAt: mo(10) },
  { id: 3, code: 'SUP-003', name: '(주)스마트컨트롤', contact: '02-3333-4444', phone: '010-3456-7890', email: 'smart@control.com', address: '서울시 강서구 마곡중앙로 300', manager: '박스마트', registeredAt: mo(8) },
  { id: 4, code: 'SUP-004', name: '(주)건자재', contact: '031-4444-5555', phone: '010-4567-8901', email: 'build@material.co.kr', address: '경기도 용인시 처인구 400', manager: '최건자재', registeredAt: mo(6) },
];

const QUOTES = [
  { id: 1, quoteNumber: 'QT-2026-001', customerId: 1, customerName: '(주)대한건설', customerPhone: '010-1111-2222', customerEmail: 'contact@daehan.co.kr', items: [{ productId: 1, productName: '산업용 복합환풍기 300mm', quantity: 20, unitPrice: 450000, total: 9000000 }, { productId: 4, productName: '천장형 복합환풍기 400mm', quantity: 10, unitPrice: 550000, total: 5500000 }], totalAmount: 14500000, validUntil: '2026-06-30', status: 'accepted', note: '신축 아파트 단지 환기 시스템', user: '김영업', createdAt: daysAgo(50), convertedOrderId: 1 },
  { id: 2, quoteNumber: 'QT-2026-002', customerId: 5, customerName: '대성종합건설', customerPhone: '010-5555-6666', customerEmail: 'build@daesung.com', items: [{ productId: 8, productName: '산업용 대형환풍기 500mm', quantity: 15, unitPrice: 850000, total: 12750000 }, { productId: 6, productName: '덕트형 환기시스템', quantity: 3, unitPrice: 1800000, total: 5400000 }], totalAmount: 18150000, validUntil: '2026-05-30', status: 'pending', note: '대형 공장 신축 - 환기 시스템 견적', user: '박영업', createdAt: daysAgo(15), convertedOrderId: null },
  { id: 3, quoteNumber: 'QT-2026-003', customerId: 2, customerName: '한국산업(주)', customerPhone: '010-2222-3333', customerEmail: 'info@hankuk.com', items: [{ productId: 3, productName: '열회수형 환기시스템', quantity: 3, unitPrice: 2500000, total: 7500000 }, { productId: 7, productName: '환풍기 스마트 제어시스템', quantity: 3, unitPrice: 350000, total: 1050000 }], totalAmount: 8550000, validUntil: '2026-05-25', status: 'pending', note: '생산라인 환기 개선 프로젝트', user: '김영업', createdAt: daysAgo(10), convertedOrderId: null },
  { id: 4, quoteNumber: 'QT-2026-004', customerId: 3, customerName: '서울설비공사', customerPhone: '010-3333-4444', customerEmail: 'seoul@facility.kr', items: [{ productId: 2, productName: '벽부형 일반환풍기 250mm', quantity: 40, unitPrice: 180000, total: 7200000 }, { productId: 9, productName: '환기 덕트 (m당)', quantity: 300, unitPrice: 15000, total: 4500000 }], totalAmount: 11700000, validUntil: '2026-04-25', status: 'rejected', note: '가격 경쟁력 부족 - 타 업체 선정', user: '이영업', createdAt: daysAgo(30), convertedOrderId: null },
  { id: 5, quoteNumber: 'QT-2026-005', customerId: 4, customerName: '(주)현대공조시스템', customerPhone: '010-4444-5555', customerEmail: 'hvac@hyundai.com', items: [{ productId: 6, productName: '덕트형 환기시스템', quantity: 8, unitPrice: 1800000, total: 14400000 }], totalAmount: 14400000, validUntil: '2026-06-10', status: 'pending', note: '대형 상업시설 환기 리모델링', user: '박영업', createdAt: daysAgo(5), convertedOrderId: null },
];

const SALES_ORDERS = [
  { id: 1, orderNumber: 'SO-2026-001', customerId: 1, customerName: '(주)대한건설', orderDate: daysAgo(45), deliveryDate: daysAgo(40), items: [{ productId: 1, productName: '산업용 복합환풍기 300mm', quantity: 20, unitPrice: 450000, total: 9000000 }, { productId: 4, productName: '천장형 복합환풍기 400mm', quantity: 10, unitPrice: 550000, total: 5500000 }], totalAmount: 14500000, paidAmount: 14500000, status: 'delivered', paymentStatus: 'paid', paymentMethod: '계좌이체', note: '아파트 단지 환기 시스템', user: '김영업' },
  { id: 2, orderNumber: 'SO-2026-002', customerId: 4, customerName: '(주)현대공조시스템', orderDate: daysAgo(30), deliveryDate: daysAgo(25), items: [{ productId: 3, productName: '열회수형 환기시스템', quantity: 5, unitPrice: 2500000, total: 12500000 }, { productId: 7, productName: '환풍기 스마트 제어시스템', quantity: 5, unitPrice: 350000, total: 1750000 }], totalAmount: 14250000, paidAmount: 14250000, status: 'delivered', paymentStatus: 'paid', paymentMethod: '세금계산서', note: '상업 빌딩 환기 시스템', user: '박영업' },
  { id: 3, orderNumber: 'SO-2026-003', customerId: 3, customerName: '서울설비공사', orderDate: daysAgo(20), deliveryDate: daysAgo(15), items: [{ productId: 4, productName: '천장형 복합환풍기 400mm', quantity: 8, unitPrice: 550000, total: 4400000 }, { productId: 9, productName: '환기 덕트 (m당)', quantity: 200, unitPrice: 15000, total: 3000000 }], totalAmount: 7400000, paidAmount: 3000000, status: 'delivered', paymentStatus: 'partial', paymentMethod: '계좌이체', note: '공장 환기 시설', user: '이영업' },
  { id: 4, orderNumber: 'SO-2026-004', customerId: 2, customerName: '한국산업(주)', orderDate: daysAgo(10), deliveryDate: daysAgo(5), items: [{ productId: 2, productName: '벽부형 일반환풍기 250mm', quantity: 30, unitPrice: 180000, total: 5400000 }, { productId: 5, productName: '창문형 일반환풍기 200mm', quantity: 20, unitPrice: 120000, total: 2400000 }], totalAmount: 7800000, paidAmount: 0, status: 'processing', paymentStatus: 'pending', paymentMethod: '세금계산서', note: '생산 공장 환기 교체', user: '김영업' },
  { id: 5, orderNumber: 'SO-2026-005', customerId: 5, customerName: '대성종합건설', orderDate: daysAgo(5), deliveryDate: null, items: [{ productId: 8, productName: '산업용 대형환풍기 500mm', quantity: 10, unitPrice: 850000, total: 8500000 }, { productId: 7, productName: '환풍기 스마트 제어시스템', quantity: 10, unitPrice: 350000, total: 3500000 }], totalAmount: 12000000, paidAmount: 6000000, status: 'pending', paymentStatus: 'partial', paymentMethod: '계좌이체', note: '대형 공장 신축 환기 시스템', user: '박영업' },
];

const PURCHASE_ORDERS = [
  { id: 1, purchaseNumber: 'PO-2026-001', supplierId: 1, supplierName: '(주)에어텍', purchaseDate: daysAgo(50), expectedDate: daysAgo(45), items: [{ productId: 1, productName: '산업용 복합환풍기 300mm', quantity: 30, unitPrice: 280000, total: 8400000 }, { productId: 4, productName: '천장형 복합환풍기 400mm', quantity: 20, unitPrice: 340000, total: 6800000 }], totalAmount: 15200000, paidAmount: 15200000, status: 'received', paymentStatus: 'paid', paymentMethod: '계좌이체', note: '정기 발주', user: '최관리' },
  { id: 2, purchaseNumber: 'PO-2026-002', supplierId: 2, supplierName: '(주)클린에어', purchaseDate: daysAgo(35), expectedDate: daysAgo(30), items: [{ productId: 3, productName: '열회수형 환기시스템', quantity: 8, unitPrice: 1600000, total: 12800000 }, { productId: 6, productName: '덕트형 환기시스템', quantity: 5, unitPrice: 1100000, total: 5500000 }], totalAmount: 18300000, paidAmount: 18300000, status: 'received', paymentStatus: 'paid', paymentMethod: '세금계산서', note: '고급 환기 시스템 발주', user: '최관리' },
  { id: 3, purchaseNumber: 'PO-2026-003', supplierId: 3, supplierName: '(주)스마트컨트롤', purchaseDate: daysAgo(20), expectedDate: daysAgo(15), items: [{ productId: 7, productName: '환풍기 스마트 제어시스템', quantity: 30, unitPrice: 220000, total: 6600000 }], totalAmount: 6600000, paidAmount: 0, status: 'received', paymentStatus: 'pending', paymentMethod: '세금계산서', note: '제어 시스템 추가 발주', user: '최관리' },
  { id: 4, purchaseNumber: 'PO-2026-004', supplierId: 4, supplierName: '(주)건자재', purchaseDate: daysAgo(10), expectedDate: daysAgo(7), items: [{ productId: 9, productName: '환기 덕트 (m당)', quantity: 300, unitPrice: 8000, total: 2400000 }, { productId: 10, productName: '환기구 그릴 200mm', quantity: 100, unitPrice: 12000, total: 1200000 }], totalAmount: 3600000, paidAmount: 1800000, status: 'received', paymentStatus: 'partial', paymentMethod: '현금', note: '부자재 보충', user: '최관리' },
  { id: 5, purchaseNumber: 'PO-2026-005', supplierId: 1, supplierName: '(주)에어텍', purchaseDate: daysAgo(3), expectedDate: new Date(Date.now() + 4 * 86400000).toISOString(), items: [{ productId: 2, productName: '벽부형 일반환풍기 250mm', quantity: 50, unitPrice: 110000, total: 5500000 }, { productId: 5, productName: '창문형 일반환풍기 200mm', quantity: 50, unitPrice: 75000, total: 3750000 }], totalAmount: 9250000, paidAmount: 0, status: 'ordered', paymentStatus: 'pending', paymentMethod: '세금계산서', note: '일반 환풍기 정기 발주', user: '최관리' },
];

const EXPENSES = [
  { id: 1, category: '인건비', amount: 8500000, date: mo(2, 25), description: '2월 급여', paymentMethod: '계좌이체', user: '경영지원' },
  { id: 2, category: '임대료', amount: 2200000, date: mo(2, 5), description: '사무실/창고 임대료', paymentMethod: '계좌이체', user: '경영지원' },
  { id: 3, category: '차량유지비', amount: 350000, date: mo(2, 15), description: '배달 차량 유지비', paymentMethod: '법인카드', user: '경영지원' },
  { id: 4, category: '광고홍보비', amount: 500000, date: mo(2, 10), description: '온라인 광고', paymentMethod: '법인카드', user: '경영지원' },
  { id: 5, category: '인건비', amount: 8500000, date: mo(1, 25), description: '3월 급여', paymentMethod: '계좌이체', user: '경영지원' },
  { id: 6, category: '임대료', amount: 2200000, date: mo(1, 5), description: '사무실/창고 임대료', paymentMethod: '계좌이체', user: '경영지원' },
  { id: 7, category: '통신비', amount: 180000, date: mo(1, 15), description: '전화/인터넷 요금', paymentMethod: '자동이체', user: '경영지원' },
  { id: 8, category: '소모품', amount: 250000, date: mo(1, 20), description: '사무용품', paymentMethod: '법인카드', user: '경영지원' },
  { id: 9, category: '인건비', amount: 8500000, date: daysAgo(5), description: '4월 급여', paymentMethod: '계좌이체', user: '경영지원' },
  { id: 10, category: '임대료', amount: 2200000, date: daysAgo(25), description: '사무실/창고 임대료', paymentMethod: '계좌이체', user: '경영지원' },
  { id: 11, category: '공과금', amount: 320000, date: daysAgo(15), description: '전기/수도 요금', paymentMethod: '자동이체', user: '경영지원' },
  { id: 12, category: '기타', amount: 150000, date: daysAgo(8), description: '기타 운영비', paymentMethod: '현금', user: '경영지원' },
];

const OTHER_INCOME = [
  { id: 1, category: '설치공사', amount: 1500000, date: mo(2, 20), description: '(주)대한건설 현장 설치 공사비', paymentMethod: '계좌이체', user: '박영업' },
  { id: 2, category: '유지보수', amount: 800000, date: mo(1, 15), description: '한국산업(주) 정기 점검', paymentMethod: '계좌이체', user: '이영업' },
  { id: 3, category: '설치공사', amount: 2200000, date: daysAgo(20), description: '서울설비공사 현장 설치', paymentMethod: '계좌이체', user: '박영업' },
  { id: 4, category: '유지보수', amount: 500000, date: daysAgo(12), description: '(주)현대공조시스템 유지보수', paymentMethod: '현금', user: '김영업' },
];

const TRANSACTIONS = [
  { id: 1, productId: 1, productName: '산업용 복합환풍기 300mm', type: 'in', quantity: 30, unitPrice: 280000, date: daysAgo(50), note: '정기 발주 입고', user: '최관리', reference: 'PO-2026-001' },
  { id: 2, productId: 4, productName: '천장형 복합환풍기 400mm', type: 'in', quantity: 20, unitPrice: 340000, date: daysAgo(50), note: '정기 발주 입고', user: '최관리', reference: 'PO-2026-001' },
  { id: 3, productId: 1, productName: '산업용 복합환풍기 300mm', type: 'out', quantity: 20, unitPrice: 450000, date: daysAgo(40), note: '(주)대한건설 출고', user: '김영업', reference: 'SO-2026-001' },
  { id: 4, productId: 4, productName: '천장형 복합환풍기 400mm', type: 'out', quantity: 10, unitPrice: 550000, date: daysAgo(40), note: '(주)대한건설 출고', user: '김영업', reference: 'SO-2026-001' },
  { id: 5, productId: 3, productName: '열회수형 환기시스템', type: 'in', quantity: 8, unitPrice: 1600000, date: daysAgo(35), note: '고급 환기 시스템 입고', user: '최관리', reference: 'PO-2026-002' },
  { id: 6, productId: 6, productName: '덕트형 환기시스템', type: 'in', quantity: 5, unitPrice: 1100000, date: daysAgo(35), note: '덕트형 환기 시스템 입고', user: '최관리', reference: 'PO-2026-002' },
  { id: 7, productId: 3, productName: '열회수형 환기시스템', type: 'out', quantity: 5, unitPrice: 2500000, date: daysAgo(25), note: '(주)현대공조시스템 출고', user: '박영업', reference: 'SO-2026-002' },
  { id: 8, productId: 7, productName: '환풍기 스마트 제어시스템', type: 'in', quantity: 30, unitPrice: 220000, date: daysAgo(20), note: '제어시스템 입고', user: '최관리', reference: 'PO-2026-003' },
  { id: 9, productId: 4, productName: '천장형 복합환풍기 400mm', type: 'out', quantity: 8, unitPrice: 550000, date: daysAgo(15), note: '서울설비공사 출고', user: '이영업', reference: 'SO-2026-003' },
  { id: 10, productId: 9, productName: '환기 덕트 (m당)', type: 'in', quantity: 300, unitPrice: 8000, date: daysAgo(10), note: '부자재 입고', user: '최관리', reference: 'PO-2026-004' },
  { id: 11, productId: 2, productName: '벽부형 일반환풍기 250mm', type: 'out', quantity: 30, unitPrice: 180000, date: daysAgo(5), note: '한국산업(주) 출고', user: '김영업', reference: 'SO-2026-004' },
  { id: 12, productId: 5, productName: '창문형 일반환풍기 200mm', type: 'out', quantity: 20, unitPrice: 120000, date: daysAgo(5), note: '한국산업(주) 출고', user: '김영업', reference: 'SO-2026-004' },
];

const useAppStore = create(
  persist(
    (set, get) => ({
      products: PRODUCTS,
      transactions: TRANSACTIONS,
      quotes: QUOTES,
      salesOrders: SALES_ORDERS,
      purchaseOrders: PURCHASE_ORDERS,
      expenses: EXPENSES,
      otherIncome: OTHER_INCOME,
      customers: CUSTOMERS,
      suppliers: SUPPLIERS,
      productCategories: ['복합환풍기', '일반환풍기', '환기시스템', '제어시스템', '부자재'],
      expenseCategories: ['인건비', '임대료', '차량유지비', '광고홍보비', '통신비', '공과금', '소모품', '기타'],
      otherIncomeCategories: ['설치공사', '유지보수', '기타'],

      // ── 제품/재고 ──────────────────────────────
      addProduct: (p) => {
        const n = { ...p, id: Date.now(), updatedAt: new Date().toISOString() };
        set((s) => ({ products: [...s.products, n] }));
      },
      updateProduct: (id, upd) => {
        set((s) => ({ products: s.products.map((p) => p.id === id ? { ...p, ...upd, updatedAt: new Date().toISOString() } : p) }));
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

      // ── 견적 ───────────────────────────────────
      addQuote: (q) => {
        const cnt = get().quotes.length + 1;
        const n = { ...q, id: Date.now(), quoteNumber: `QT-${new Date().getFullYear()}-${String(cnt).padStart(3, '0')}`, createdAt: new Date().toISOString(), status: q.status || 'pending', convertedOrderId: null };
        set((s) => ({ quotes: [n, ...s.quotes] }));
        return n;
      },
      updateQuote: (id, upd) => set((s) => ({ quotes: s.quotes.map((q) => q.id === id ? { ...q, ...upd } : q) })),
      deleteQuote: (id) => set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) })),

      // ── 매출 ───────────────────────────────────
      addSalesOrder: (o) => {
        const cnt = get().salesOrders.length + 1;
        const n = { ...o, id: Date.now(), orderNumber: `SO-${new Date().getFullYear()}-${String(cnt).padStart(3, '0')}`, orderDate: new Date().toISOString(), status: 'pending', paymentStatus: (o.paidAmount || 0) >= o.totalAmount ? 'paid' : (o.paidAmount || 0) > 0 ? 'partial' : 'pending' };
        set((s) => ({ salesOrders: [n, ...s.salesOrders] }));
        return n;
      },
      updateSalesOrder: (id, upd) => set((s) => ({ salesOrders: s.salesOrders.map((o) => o.id === id ? { ...o, ...upd } : o) })),
      deleteSalesOrder: (id) => set((s) => ({ salesOrders: s.salesOrders.filter((o) => o.id !== id) })),

      // ── 매입 ───────────────────────────────────
      addPurchaseOrder: (o) => {
        const cnt = get().purchaseOrders.length + 1;
        const n = { ...o, id: Date.now(), purchaseNumber: `PO-${new Date().getFullYear()}-${String(cnt).padStart(3, '0')}`, purchaseDate: new Date().toISOString(), status: 'ordered', paymentStatus: (o.paidAmount || 0) >= o.totalAmount ? 'paid' : (o.paidAmount || 0) > 0 ? 'partial' : 'pending' };
        set((s) => ({ purchaseOrders: [n, ...s.purchaseOrders] }));
        return n;
      },
      updatePurchaseOrder: (id, upd) => set((s) => ({ purchaseOrders: s.purchaseOrders.map((o) => o.id === id ? { ...o, ...upd } : o) })),
      deletePurchaseOrder: (id) => set((s) => ({ purchaseOrders: s.purchaseOrders.filter((o) => o.id !== id) })),

      // ── 지출/수입 ──────────────────────────────
      addExpense: (e) => { const n = { ...e, id: Date.now() }; set((s) => ({ expenses: [n, ...s.expenses] })); },
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
      addOtherIncome: (i) => { const n = { ...i, id: Date.now() }; set((s) => ({ otherIncome: [n, ...s.otherIncome] })); },
      deleteOtherIncome: (id) => set((s) => ({ otherIncome: s.otherIncome.filter((i) => i.id !== id) })),

      // ── 거래처/공급업체 ───────────────────────
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

      // ── 계산 헬퍼 ─────────────────────────────
      getLowStockProducts: () => get().products.filter((p) => p.quantity <= p.minQuantity),
      getTotalInventoryValue: () => get().products.reduce((s, p) => s + p.quantity * p.salePrice, 0),
      getTotalUnpaidReceivable: () => get().salesOrders.reduce((s, o) => s + (o.totalAmount - o.paidAmount), 0),
      getTotalUnpaidPayable: () => get().purchaseOrders.reduce((s, o) => s + (o.totalAmount - o.paidAmount), 0),

      getMonthSalesRevenue: (year, month) => {
        const s = new Date(year, month - 1, 1), e = new Date(year, month, 0, 23, 59, 59);
        return get().salesOrders.filter((o) => { const d = new Date(o.orderDate); return d >= s && d <= e; }).reduce((sum, o) => sum + o.totalAmount, 0)
          + get().otherIncome.filter((i) => { const d = new Date(i.date); return d >= s && d <= e; }).reduce((sum, i) => sum + i.amount, 0);
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
    }),
    { name: 'saeron-app-v2' }
  )
);

export default useAppStore;
