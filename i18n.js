/* UI strings. Synced data (place names, memos, trip names) is never translated. */
const I18N = {
  ko: {
    appName:'나주네 리스트', syncStatus:'동기화 상태', searchPh:'장소 검색 (예: 성수 카페)',
    tabPlaces:'장소', tabTrips:'일정', tabShare:'공유', newTrip:'+ 새 일정',
    tripHint:'장소 카드의 ＋일정 버튼으로 추가하고, ☰ 를 끌어서 순서를 바꿔요.',
    spaceCode:'우리 공간 코드', joinPh:'코드 입력해서 참여', join:'참여', copyLink:'초대 링크 복사', newSpace:'새 코드 만들기',
    backupHint:'백업용으로 JSON 내보내기/가져오기도 할 수 있어요.', export:'내보내기 (JSON)', import:'가져오기', sample:'샘플 데이터', reset:'전체 초기화',
    myName:'내 이름', myNamePh:'예: 한빛',
    addPlace:'장소 추가', editPlace:'장소 수정', name:'이름', category:'카테고리', status:'상태', cost:'예상 비용 (원)', memo:'메모',
    delete:'삭제', cancel:'취소', save:'저장',
    newTripTitle:'새 일정 만들기', tripName:'일정 이름', tripNamePh:'예: 부산 1일차', create:'만들기',
    presetDay:'여행 {n}일차', presetWeekend:'주말 데이트', presetFood:'맛집 투어', presetCafe:'카페 투어', firstTrip:'첫 번째 일정',
    catFood:'맛집', catCafe:'카페', catStay:'숙소', catSight:'관광지', catEtc:'기타',
    stWish:'가고싶은곳', stPlanned:'일정에넣음', stDone:'다녀옴',
    fAll:'전체', fHeart:'💗 찜', heart:'찜', addToTrip:'일정에 추가', removeStop:'빼기', reorder:'순서 변경',
    emptyPlaces:'검색해서 장소를 추가하거나, 지도를 길게 눌러 핀을 찍어보세요 🧸', noTrips:'일정 없음',
    leg:'↓ 직선 {d}', tripMeta:'{n}곳 · 총 직선거리 {d}', tripCost:' · 예상 {c}', tripEmpty:'새 일정을 만들어보세요.',
    won:'{n}원', by:'by {name}', noResults:'검색 결과가 없어요',
    tAdded:'"{name}" 일정에 추가했어요', tTripMade:'"{name}" 만들었어요 🗓️', tSearchFail:'검색에 실패했어요', tPinned:'핀을 꽂았어요 📍',
    tExported:'내보냈어요', tMerged:'합쳤어요 💞', tBadFile:'파일을 읽지 못했어요', tSample:'샘플을 불러왔어요',
    tShort:'코드는 3글자 이상이에요', tCopied:'링크를 복사했어요', tRemote:'상대방이 업데이트했어요 ✨',
    cDelete:'삭제할까요?', cReset:'모든 데이터를 지울까요?', cNewSpace:'새 공간으로 이동할까요? (지금 목록은 기존 코드에 그대로 남아요)',
    syncOnline:'실시간 동기화 중이에요. 같은 코드로 들어오면 바로 같이 보여요 💞', syncConnecting:'연결 중…', syncLocal:'이 기기에만 저장하고 있어요',
    errNoLib:'Supabase 라이브러리를 못 불러와서 이 기기에만 저장돼요', errNoTable:'서버 테이블이 아직 없어서 이 기기에만 저장돼요 (supabase.sql 실행 필요)',
    errOffline:'오프라인이에요. 이 기기에 저장하고 있어요', errSync:'동기화 실패 — 이 기기에 저장했어요', errRealtime:'실시간 연결이 끊겼어요. 다시 연결 중…',
  },
  ja: {
    appName:'ナジュネ・リスト', syncStatus:'同期ステータス', searchPh:'スポットを検索',
    tabPlaces:'スポット', tabTrips:'プラン', tabShare:'共有', newTrip:'+ 新しいプラン',
    tripHint:'スポットカードの＋ボタンで追加して、☰ をドラッグすると順番を変えられます。',
    spaceCode:'ふたりのスペースコード', joinPh:'コードを入力して参加', join:'参加', copyLink:'招待リンクをコピー', newSpace:'新しいコードを作成',
    backupHint:'バックアップ用にJSONの書き出し・読み込みもできます。', export:'書き出し (JSON)', import:'読み込み', sample:'サンプルデータ', reset:'すべてリセット',
    myName:'わたしの名前', myNamePh:'例:ハンビッ',
    addPlace:'スポットを追加', editPlace:'スポットを編集', name:'名前', category:'カテゴリー', status:'ステータス', cost:'予算 (ウォン)', memo:'メモ',
    delete:'削除', cancel:'キャンセル', save:'保存',
    newTripTitle:'新しいプランを作成', tripName:'プラン名', tripNamePh:'例:釜山1日目', create:'作成',
    presetDay:'旅行{n}日目', presetWeekend:'週末デート', presetFood:'グルメ巡り', presetCafe:'カフェ巡り', firstTrip:'はじめてのプラン',
    catFood:'グルメ', catCafe:'カフェ', catStay:'宿泊', catSight:'観光', catEtc:'その他',
    stWish:'行きたい', stPlanned:'プランに追加済み', stDone:'行った',
    fAll:'すべて', fHeart:'💗 お気に入り', heart:'お気に入り', addToTrip:'プランに追加', removeStop:'外す', reorder:'並べ替え',
    emptyPlaces:'検索してスポットを追加するか、地図を長押ししてピンを立ててみてね 🧸', noTrips:'プランなし',
    leg:'↓ 直線 {d}', tripMeta:'{n}か所 · 直線距離 合計 {d}', tripCost:' · 予算 {c}', tripEmpty:'新しいプランを作ってみましょう。',
    won:'₩{n}', by:'by {name}', noResults:'見つかりませんでした',
    tAdded:'「{name}」をプランに追加しました', tTripMade:'「{name}」を作成しました 🗓️', tSearchFail:'検索に失敗しました', tPinned:'ピンを立てました 📍',
    tExported:'書き出しました', tMerged:'統合しました 💞', tBadFile:'ファイルを読み込めませんでした', tSample:'サンプルを読み込みました',
    tShort:'コードは3文字以上にしてください', tCopied:'リンクをコピーしました', tRemote:'相手が更新しました ✨',
    cDelete:'削除しますか?', cReset:'すべてのデータを消去しますか?', cNewSpace:'新しいスペースに移動しますか?(今のリストは元のコードにそのまま残ります)',
    syncOnline:'リアルタイム同期中。同じコードで入るとすぐに一緒に見られます 💞', syncConnecting:'接続中…', syncLocal:'この端末にだけ保存しています',
    errNoLib:'Supabaseを読み込めなかったため、この端末にだけ保存しています', errNoTable:'サーバーのテーブルがまだないため、この端末にだけ保存しています(supabase.sqlの実行が必要)',
    errOffline:'オフラインです。この端末に保存しています', errSync:'同期に失敗しました — この端末に保存しました', errRealtime:'リアルタイム接続が切れました。再接続中…',
  }
};
const LANGS = ['ko', 'ja'];
let LANG = LANGS.includes(localStorage.getItem('najune-lang')) ? localStorage.getItem('najune-lang') : 'ko';
function t(k, v = {}) {
  let s = I18N[LANG][k] ?? I18N.ko[k];
  if (s === undefined) { console.error('i18n missing key: ' + k); return k; }
  return s.replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');
}
function applyI18n() {
  document.documentElement.lang = LANG;
  document.title = t('appName');
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', t('appName'));
  document.querySelectorAll('[data-i18n]').forEach(el => { const n = [...el.childNodes].find(x => x.nodeType === 3 && x.textContent.trim()); if (n) n.textContent = t(el.dataset.i18n); else el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => el.placeholder = t(el.dataset.i18nPh));
  document.querySelectorAll('[data-i18n-title]').forEach(el => el.title = t(el.dataset.i18nTitle));
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === LANG));
  document.querySelector('.lang')?.style.setProperty('--i', LANGS.indexOf(LANG));
}
function setLang(l) { if (!LANGS.includes(l) || l === LANG) return; LANG = l; localStorage.setItem('najune-lang', l); applyI18n(); document.dispatchEvent(new Event('langchange')); }
