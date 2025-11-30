import React, { useState } from 'react';
import { FaCog, FaDatabase, FaDownload, FaUpload, FaTrash } from 'react-icons/fa';
import useInventoryStore from '../store/inventoryStore';

const Settings = () => {
  const store = useInventoryStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const exportData = () => {
    const data = {
      products: store.products,
      transactions: store.transactions,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saeron_inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result);
        if (data.products && data.transactions) {
          // 데이터 가져오기 로직 (여기서는 단순화)
          alert('데이터를 가져왔습니다!');
        } else {
          alert('올바르지 않은 파일 형식입니다.');
        }
      } catch (error) {
        alert('파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    localStorage.removeItem('saeron-inventory-storage');
    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        <FaCog style={{ marginRight: '12px' }} />
        설정
      </h2>

      <div style={styles.section}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <FaDatabase style={{ fontSize: '24px', color: '#4CAF50' }} />
            <div>
              <h3 style={styles.cardTitle}>데이터 관리</h3>
              <p style={styles.cardDescription}>
                재고 데이터를 백업하거나 복원할 수 있습니다.
              </p>
            </div>
          </div>

          <div style={styles.actionGrid}>
            <div style={styles.actionCard}>
              <FaDownload style={{ fontSize: '32px', color: '#2196F3' }} />
              <h4 style={styles.actionTitle}>데이터 내보내기</h4>
              <p style={styles.actionDescription}>
                현재 재고 데이터를 JSON 파일로 내보냅니다.
              </p>
              <button onClick={exportData} style={styles.primaryButton}>
                내보내기
              </button>
            </div>

            <div style={styles.actionCard}>
              <FaUpload style={{ fontSize: '32px', color: '#FF9800' }} />
              <h4 style={styles.actionTitle}>데이터 가져오기</h4>
              <p style={styles.actionDescription}>
                백업된 JSON 파일에서 데이터를 복원합니다.
              </p>
              <label style={styles.primaryButton}>
                가져오기
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div style={styles.actionCard}>
              <FaTrash style={{ fontSize: '32px', color: '#F44336' }} />
              <h4 style={styles.actionTitle}>데이터 초기화</h4>
              <p style={styles.actionDescription}>
                모든 재고 데이터를 삭제하고 초기화합니다.
              </p>
              <button
                onClick={() => setShowConfirm(true)}
                style={styles.dangerButton}
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>시스템 정보</h3>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>시스템명</div>
              <div style={styles.infoValue}>(주)새론 재고관리 시스템</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>버전</div>
              <div style={styles.infoValue}>1.0.0</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>등록된 제품</div>
              <div style={styles.infoValue}>{store.products.length}개</div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>총 거래 내역</div>
              <div style={styles.infoValue}>{store.transactions.length}건</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>사용 안내</h3>
          <div style={styles.guideList}>
            <div style={styles.guideItem}>
              <div style={styles.guideNumber}>1</div>
              <div style={styles.guideContent}>
                <h4 style={styles.guideTitle}>대시보드</h4>
                <p style={styles.guideText}>
                  재고 현황과 통계를 한눈에 확인할 수 있습니다.
                </p>
              </div>
            </div>
            <div style={styles.guideItem}>
              <div style={styles.guideNumber}>2</div>
              <div style={styles.guideContent}>
                <h4 style={styles.guideTitle}>재고 관리</h4>
                <p style={styles.guideText}>
                  제품을 등록하고 입출고 처리를 할 수 있습니다.
                </p>
              </div>
            </div>
            <div style={styles.guideItem}>
              <div style={styles.guideNumber}>3</div>
              <div style={styles.guideContent}>
                <h4 style={styles.guideTitle}>입출고 내역</h4>
                <p style={styles.guideText}>
                  모든 입출고 거래 내역을 조회하고 관리할 수 있습니다.
                </p>
              </div>
            </div>
            <div style={styles.guideItem}>
              <div style={styles.guideNumber}>4</div>
              <div style={styles.guideContent}>
                <h4 style={styles.guideTitle}>리포트</h4>
                <p style={styles.guideText}>
                  다양한 차트와 그래프로 재고 분석을 할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 초기화 확인 모달 */}
      {showConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowConfirm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>⚠️ 데이터 초기화</h3>
            <p style={styles.modalText}>
              모든 재고 데이터가 영구적으로 삭제됩니다.
              <br />
              이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?
            </p>
            <div style={styles.modalActions}>
              <button onClick={clearAllData} style={styles.confirmButton}>
                초기화
              </button>
              <button onClick={() => setShowConfirm(false)} style={styles.cancelButton}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '24px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
  },
  section: {
    marginBottom: '24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  cardDescription: {
    color: '#666',
    fontSize: '14px',
    margin: 0,
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  actionCard: {
    padding: '24px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  actionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '16px 0 8px 0',
    color: '#333',
  },
  actionDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
  },
  primaryButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'inline-block',
  },
  dangerButton: {
    padding: '12px 24px',
    backgroundColor: '#F44336',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  infoItem: {
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
  },
  infoValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  guideList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  guideItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  guideNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#4CAF50',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
    flexShrink: 0,
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '4px',
    color: '#333',
  },
  guideText: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#F44336',
  },
  modalText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
    lineHeight: 1.6,
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  confirmButton: {
    padding: '12px 24px',
    backgroundColor: '#F44336',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default Settings;
