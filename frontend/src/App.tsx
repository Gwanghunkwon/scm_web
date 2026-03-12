import { useMemo, useState } from 'react'
import './App.css'

type MenuKey =
  | 'dashboard'
  | 'items'
  | 'bom'
  | 'leadtime'
  | 'forecast'
  | 'production'
  | 'bomCalc'
  | 'mrp'
  | 'poPlan'
  | 'po'
  | 'inventory'
  | 'stock'

function App() {
  const [activeMenu, setActiveMenu] = useState<MenuKey>('dashboard')

  const pageMeta = useMemo(() => {
    switch (activeMenu) {
      case 'items':
        return {
          title: '품목 관리',
          path: ['기초 데이터', '품목 관리'],
          description: '제품/원자재 마스터를 관리하는 화면입니다. 엑셀 업로드, 단위/안전재고/기본창고 등을 여기서 설정하게 됩니다.',
        }
      case 'bom':
        return {
          title: 'BOM 관리',
          path: ['기초 데이터', 'BOM 관리'],
          description: '제품별 배합비(BOM)를 등록·수정하는 화면입니다. 상위 제품 1단위당 필요한 자재 구성을 정의합니다.',
        }
      case 'leadtime':
        return {
          title: '리드타임/거래처',
          path: ['기초 데이터', '리드타임/거래처'],
          description: '품목·공급사별 리드타임과 최소 발주수량 등을 등록하는 화면입니다.',
        }
      case 'forecast':
        return {
          title: '수요예측',
          path: ['수요/생산', '수요예측'],
          description: '제품/기간별 수요예측 수량을 입력하고, 과거 실적과 비교하는 화면입니다.',
        }
      case 'production':
        return {
          title: '생산계획',
          path: ['수요/생산', '생산계획'],
          description: '수요예측을 기반으로 제품별 생산계획을 수립·확정하는 화면입니다.',
        }
      case 'bomCalc':
        return {
          title: '소요량(BOM) 계산',
          path: ['자재/MRP', '소요량(BOM) 계산'],
          description: '확정된 생산계획을 BOM으로 전개하여 자재 소요량을 계산하는 화면입니다.',
        }
      case 'mrp':
        return {
          title: 'MRP 결과',
          path: ['자재/MRP', 'MRP 결과'],
          description: '재고/리드타임/안전재고를 반영한 자재 부족 수량과 발주 제안을 확인하는 화면입니다.',
        }
      case 'poPlan':
        return {
          title: '발주 계획',
          path: ['발주/구매', '발주 계획'],
          description: 'MRP 결과를 기반으로 발주 대상 품목과 수량을 검토하는 화면입니다.',
        }
      case 'po':
        return {
          title: '발주서 관리',
          path: ['발주/구매', '발주서 관리'],
          description: '공급사별 발주서를 생성하고, 상태/납기/수량을 관리하는 화면입니다.',
        }
      case 'inventory':
        return {
          title: '재고 현황',
          path: ['재고', '재고 현황'],
          description: '품목/창고별 현재 재고와 안전재고 대비 상태를 조회하는 화면입니다.',
        }
      case 'stock':
        return {
          title: '입출고 관리',
          path: ['재고', '입출고 관리'],
          description: '입고·출고·조정 등 재고 변동 작업을 처리하고 이력을 조회하는 화면입니다.',
        }
      default:
        return {
          title: '대시보드',
          path: ['메인', '대시보드'],
          description:
            '수요예측, 생산계획, 재고, 발주 정보를 한 눈에 모아보는 홈 화면입니다. 지금은 뼈대 단계이며 이후 실제 데이터와 그래프를 연결합니다.',
        }
    }
  }, [activeMenu])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-header-title">경량 SCM 시스템</div>
          <div className="app-header-subtitle">
            수요예측 → 생산계획 → BOM → MRP → 발주 → 재고를 한 곳에서
          </div>
        </div>
        <div className="app-header-right">
          <span className="app-tag">MVP · 내부용</span>
          <span>플로우: 수요 → 생산 → MRP → 발주 → 재고</span>
        </div>
      </header>
      <div className="app-body">
        <nav className="app-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-section-title">메인</div>
            <button
              className={`sidebar-item ${activeMenu === 'dashboard' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('dashboard')}
            >
              <span className="sidebar-item-label">대시보드</span>
              <span className="sidebar-item-badge">개요</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">기초 데이터</div>
            <button
              className={`sidebar-item ${activeMenu === 'items' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('items')}
            >
              <span className="sidebar-item-label">품목 관리</span>
            </button>
            <button
              className={`sidebar-item ${activeMenu === 'bom' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('bom')}
            >
              <span className="sidebar-item-label">BOM 관리</span>
            </button>
            <button
              className={`sidebar-item ${activeMenu === 'leadtime' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('leadtime')}
            >
              <span className="sidebar-item-label">리드타임/거래처</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">수요/생산</div>
            <button
              className={`sidebar-item ${activeMenu === 'forecast' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('forecast')}
            >
              <span className="sidebar-item-label">수요예측</span>
            </button>
            <button
              className={`sidebar-item ${activeMenu === 'production' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('production')}
            >
              <span className="sidebar-item-label">생산계획</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">자재/MRP</div>
            <button
              className={`sidebar-item ${activeMenu === 'bomCalc' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('bomCalc')}
            >
              <span className="sidebar-item-label">소요량(BOM) 계산</span>
            </button>
            <button
              className={`sidebar-item ${activeMenu === 'mrp' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('mrp')}
            >
              <span className="sidebar-item-label">MRP 결과</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">발주/구매</div>
            <button
              className={`sidebar-item ${activeMenu === 'poPlan' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('poPlan')}
            >
              <span className="sidebar-item-label">발주 계획</span>
            </button>
            <button
              className={`sidebar-item ${activeMenu === 'po' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('po')}
            >
              <span className="sidebar-item-label">발주서 관리</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">재고</div>
            <button
              className={`sidebar-item ${activeMenu === 'inventory' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('inventory')}
            >
              <span className="sidebar-item-label">재고 현황</span>
            </button>
            <button
              className={`sidebar-item ${activeMenu === 'stock' ? 'sidebar-item-active' : ''}`}
              onClick={() => setActiveMenu('stock')}
            >
              <span className="sidebar-item-label">입출고 관리</span>
            </button>
          </div>
        </nav>

        <main className="app-content">
          <div className="breadcrumbs">
            {pageMeta.path.map((p, idx) => (
              <span key={p + idx}>{p}</span>
            ))}
          </div>

          <section className="panel">
            <div className="panel-title-row">
              <h2 className="panel-title">{pageMeta.title}</h2>
              <span className="panel-tag">화면 뼈대 · 설계 기준</span>
            </div>
            <p className="panel-description">{pageMeta.description}</p>

            {activeMenu === 'dashboard' && (
              <div className="dashboard-grid">
                <div className="card">
                  <div className="card-title">오늘 기준 재고 요약</div>
                  <div className="card-body placeholder">
                    품목 수, 품절/임박/과잉 품목 수가 여기에 표시됩니다.
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">수요 vs 생산 계획</div>
                  <div className="card-body placeholder">
                    제품별 수요예측과 생산계획을 비교하는 작은 차트가 들어갈 자리입니다.
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">발주/입고 현황</div>
                  <div className="card-body placeholder">지연 발주, 입고 예정 건수 요약이 들어갑니다.</div>
                </div>
                <div className="card">
                  <div className="card-title">알림</div>
                  <div className="card-body placeholder">
                    품절 임박 품목, BOM/리드타임 누락 등 경고성 알림이 표시됩니다.
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'items' && (
              <div className="two-column-layout">
                <div>
                  <strong>검색 조건</strong>
                  <div className="table-placeholder">
                    품목코드/명, 유형(제품/원자재), 활성 여부 등 필터가 들어갈 영역입니다.
                  </div>
                </div>
                <div>
                  <strong>품목 목록</strong>
                  <div className="table-placeholder">
                    테이블 컬럼 예시: 품목코드, 품목명, 유형, 단위, 기본창고, 안전재고, 리드타임.
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'bom' && (
              <div className="two-column-layout">
                <div>
                  <strong>제품 선택</strong>
                  <div className="table-placeholder">
                    좌측에서 상위 제품을 선택하면, 우측에 해당 제품의 BOM이 표시됩니다.
                  </div>
                </div>
                <div>
                  <strong>BOM 상세</strong>
                  <div className="table-placeholder">
                    하위 자재, 소요수량, 유효기간 등을 행 단위로 관리하는 그리드가 들어갑니다.
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'forecast' && (
              <>
                <div className="pill-row">
                  <span className="pill">기간 단위: 월/주/일 선택</span>
                  <span className="pill">과거 실적 조회</span>
                  <span className="pill">간단 예측(이동평균 등)</span>
                </div>
                <div className="table-placeholder">
                  상단에는 기간/제품 필터, 하단에는 제품×기간 그리드가 들어갑니다. 예측 수량을 직접
                  입력하거나, 버튼으로 자동 계산한 값을 채울 수 있습니다.
                </div>
              </>
            )}

            {activeMenu === 'production' && (
              <>
                <div className="pill-row">
                  <span className="pill">예측 불러오기 → 계획 생성</span>
                  <span className="pill">버전 관리(V1/V2)</span>
                  <span className="pill">임시/확정 상태</span>
                </div>
                <div className="table-placeholder">
                  수요예측에서 불러온 계획 초안을 수정하고, 확정 버튼으로 상태를 변경하는 테이블이
                  들어갑니다.
                </div>
              </>
            )}

            {activeMenu === 'bomCalc' && (
              <div className="table-placeholder">
                기간과 생산계획 버전을 선택하고, 제품별/자재별 소요량을 계산해 보여주는 표가 들어갑니다.
                후속 단계인 MRP 실행 버튼도 이 화면 하단에 배치할 수 있습니다.
              </div>
            )}

            {activeMenu === 'mrp' && (
              <div className="table-placeholder">
                품목별 총 소요량, 현재 재고, 안전재고, 부족수량, 제안 발주일, 필요 납기일을 보여주는
                MRP 결과 그리드입니다. 선택 행을 발주 계획으로 전송하는 체크박스가 포함됩니다.
              </div>
            )}

            {activeMenu === 'poPlan' && (
              <div className="table-placeholder">
                MRP에서 넘어온 발주 제안 리스트를 보여주고, 공급사 기준으로 묶어서 발주서를 생성하는
                화면입니다.
              </div>
            )}

            {activeMenu === 'po' && (
              <div className="table-placeholder">
                발주번호, 공급사, 발주일, 납기일, 상태(요청/발주/입고완료)를 관리하는 발주서 목록
                테이블입니다.
              </div>
            )}

            {activeMenu === 'inventory' && (
              <div className="table-placeholder">
                품목/창고별 재고와 안전재고 대비 상태(정상/임박/품절/과잉)를 색상으로 표시하는 재고
                현황 그리드입니다.
              </div>
            )}

            {activeMenu === 'stock' && (
              <div className="table-placeholder">
                상단에는 입고/출고 입력 폼, 하단에는 최근 입출고 이력이 표로 나오는 구조입니다.
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
