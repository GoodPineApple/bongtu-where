## 데일리 구현

### 4/14

- UI: **shadcn/ui** (preset Nova, `@/` 별칭, `src/components/ui/*` — button, input, badge, sheet, sonner, alert, card, label, separator)
- BaaS 사용: firestore / supabase(선택)
- 배포 : vercel(선택) / firebase hosting

### 4/21

- 추가기능 기획
  - PWA : Progressive Web App
  - product-feature-expansion-prd.md
- 버그 픽스
  - 서버 조회 로직 검토
  - 지도상 속도 저하 버그
- vercel 배포하기
  - 배포 완료.
  - 환경변수 주입

### 다음에 할일

- TypeScript 적용
- NextJS 적용
- PWA 적용
- 지도 기능 개선
  - 지도상 안보이는 영역에 있는 데이터를 미리 불러온건 아닌가. 적어도 현위치 기준으로 위도, 경도 값을 사용해서 주변에 있는 store정보만 불러오면 훨씬 성능이 좋겠다
  - 지도가 가끔 드래그 모션이 씹히는 현상이 있다. 원인 분석 필요하다.
