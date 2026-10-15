/* UI strings. Synced data (place names, memos, trip names) is never translated. */
const I18N = {
  ko: {
    appName:'나주네 리스트', syncStatus:'동기화 상태', searchPh:'장소 검색 (예: 성수 카페)',
    tabPlaces:'장소', tabTrips:'일정', tabShare:'공유', newTrip:'+ 새 일정',
    tripHint:'장소 카드의 ＋일정 버튼으로 추가하고, ☰ 를 끌어서 순서를 바꿔요.',
    spaceCode:'우리 공간 코드', joinPh:'코드 입력해서 참여', join:'참여', copyLink:'초대 링크 복사', newSpace:'새 코드 만들기',
    backupHint:'백업용으로 JSON 파일로 내보낼 수 있어요.', export:'내보내기 (JSON)', import:'가져오기', sample:'샘플 데이터', reset:'전체 초기화',
    myName:'내 이름', myNamePh:'예: 한빛',
    addPlace:'장소 추가', editPlace:'장소 수정', name:'이름', category:'카테고리', status:'상태', cost:'예상 비용 (원)', memo:'메모',
    delete:'삭제', cancel:'취소', save:'저장',
    newTripTitle:'새 일정 만들기', tripName:'일정 이름', tripNamePh:'예: 부산 1일차', create:'만들기',
    presetDay:'여행 {n}일차', presetWeekend:'주말 데이트', presetFood:'맛집 투어', presetCafe:'카페 투어', firstTrip:'첫 번째 일정',
    catFood:'맛집', catCafe:'카페', catStay:'숙소', catSight:'관광지', catEtc:'기타',
    stWish:'가고싶은곳', stPlanned:'일정에넣음', stDone:'다녀옴',
    fAll:'전체', fHeart:'💟 찜', heart:'찜', addToTrip:'일정에 추가', removeStop:'빼기', reorder:'순서 변경',
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
    openKakao:'카카오맵에서 열기', time:"시간", note:"메모", notePh:"예: 예약 12:20", clearTime:"지우기", modeWalk:"🚶 도보", modeCar:"🚗 차", legEst:" 예상", min:"{m}분", hmin:"{h}시간 {m}분", hour:"{h}시간", tripTotal:"{n}곳 · 이동 {time} · {d}", sortByTime:"⏱ 시간순", tSorted:"시간순으로 정렬했어요", mapTimes:"🕒 지도에 시간", editTrip:"일정 편집", tripDate:"날짜", deleteTrip:"일정 삭제", cDeleteTrip:"\"{name}\" 일정을 지울까요? 장소는 그대로 남아요.", pickTrip:"일정 선택", noDate:"날짜 없음", nPlaces:"{n}곳", restKey:"Kakao REST 키 (차 이동시간용)", restKeyHint:"이 기기에만 저장돼요. 키가 없으면 차 이동시간도 예상치로 보여요. 도보는 항상 예상치예요.", restKeyPh:"REST API 키", tKeySaved:"키를 저장했어요", tKeyCleared:"키를 지웠어요", tKeyBad:"REST 키가 거부됐어요. 키와 카카오모빌리티 사용 설정을 확인해 주세요", noticeNoV2:"항목별 동기화(v2) 테이블이 아직 없어서 예전 방식으로 동기화해요. supabase-v2.sql을 실행하면 동시에 고쳐도 안전해져요.", noticeMigrated:"기존 목록을 항목별 동기화로 옮겼어요 ✨", syncV2:"항목별 동기화 사용 중 (같이 고쳐도 서로 덮어쓰지 않아요)", catCurious:'궁금한 곳', mWalk:'도보', mCar:'차', mTransit:'대중교통', mAuto:'자동', legModeTap:'눌러서 이동수단 바꾸기', tLegAuto:'자동 ({km}km 이하는 도보)', transitInfoTitle:'대중교통 시간 안내', transitInfo:'대중교통 시간은 거리 기반 추정치예요. 실제 시간은 카카오맵에서 확인하세요.', openTransit:'🚇 카카오맵 대중교통 길찾기', walkMax:'자동 모드: 이 거리까지는 도보', walkMaxHint:'더 먼 구간은 차로 계산해요. 두 사람 모두에게 똑같이 적용돼요.', manageCats:'카테고리 관리', catHint:'이모지·이름·색을 바꾸고 화살표로 순서를 바꿔요. 지운 카테고리의 장소는 기타로 옮겨져요.', addCat:'+ 카테고리 추가', done:'완료', newCat:'새 카테고리', catNamePh:'카테고리 이름', moveUp:'위로', moveDown:'아래로', cDeleteCat:'"{name}" 카테고리를 지울까요? 이 카테고리의 장소는 기타로 옮겨져요.', photo:'사진', photoUpload:'사진 올리기', photoRemove:'지우기', photoUrlPh:'이미지 주소 (https://…)', tPhotoFail:'이미지를 불러오지 못했어요', errMap:'카카오 지도를 불러오지 못했어요. 도메인 등록이나 지도 사용 설정을 확인해 주세요. 목록과 동기화는 그대로 쓸 수 있어요.',
  },
  ja: {
    appName:'ナジュネ・リスト', syncStatus:'同期ステータス', searchPh:'スポットを検索',
    tabPlaces:'スポット', tabTrips:'プラン', tabShare:'共有', newTrip:'+ 新しいプラン',
    tripHint:'スポットカードの＋ボタンで追加して、☰ をドラッグすると順番を変えられます。',
    spaceCode:'ふたりのスペースコード', joinPh:'コードを入力して参加', join:'参加', copyLink:'招待リンクをコピー', newSpace:'新しいコードを作成',
    backupHint:'バックアップ用にJSONファイルとして書き出せます。', export:'書き出し (JSON)', import:'読み込み', sample:'サンプルデータ', reset:'すべてリセット',
    myName:'わたしの名前', myNamePh:'例:ハンビッ',
    addPlace:'スポットを追加', editPlace:'スポットを編集', name:'名前', category:'カテゴリー', status:'ステータス', cost:'予算 (ウォン)', memo:'メモ',
    delete:'削除', cancel:'キャンセル', save:'保存',
    newTripTitle:'新しいプランを作成', tripName:'プラン名', tripNamePh:'例:釜山1日目', create:'作成',
    presetDay:'旅行{n}日目', presetWeekend:'週末デート', presetFood:'グルメ巡り', presetCafe:'カフェ巡り', firstTrip:'はじめてのプラン',
    catFood:'グルメ', catCafe:'カフェ', catStay:'宿泊', catSight:'観光', catEtc:'その他',
    stWish:'行きたい', stPlanned:'プランに追加済み', stDone:'行った',
    fAll:'すべて', fHeart:'💟 お気に入り', heart:'お気に入り', addToTrip:'プランに追加', removeStop:'外す', reorder:'並べ替え',
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
    openKakao:'カカオマップで開く', time:"時間", note:"メモ", notePh:"例:予約 12:20", clearTime:"クリア", modeWalk:"🚶 徒歩", modeCar:"🚗 車", legEst:" 目安", min:"{m}分", hmin:"{h}時間{m}分", hour:"{h}時間", tripTotal:"{n}か所 · 移動 {time} · {d}", sortByTime:"⏱ 時間順", tSorted:"時間順に並べ替えました", mapTimes:"🕒 地図に時間", editTrip:"プランを編集", tripDate:"日付", deleteTrip:"プランを削除", cDeleteTrip:"「{name}」を削除しますか?スポットはそのまま残ります。", pickTrip:"プランを選択", noDate:"日付なし", nPlaces:"{n}か所", restKey:"Kakao RESTキー(車の所要時間用)", restKeyHint:"この端末にだけ保存されます。キーがない場合、車の時間も目安になります。徒歩は常に目安です。", restKeyPh:"REST APIキー", tKeySaved:"キーを保存しました", tKeyCleared:"キーを削除しました", tKeyBad:"RESTキーが拒否されました。キーとカカオモビリティの利用設定を確認してください", noticeNoV2:"項目ごとの同期(v2)テーブルがまだないため、従来の方式で同期しています。supabase-v2.sqlを実行すると同時編集でも安全になります。", noticeMigrated:"既存のリストを項目ごとの同期に移行しました ✨", syncV2:"項目ごとに同期中(同時に編集しても上書きされません)", catCurious:'気になる所', mWalk:'徒歩', mCar:'車', mTransit:'公共交通', mAuto:'自動', legModeTap:'タップで移動手段を切り替え', tLegAuto:'自動({km}km以下は徒歩)', transitInfoTitle:'公共交通の所要時間について', transitInfo:'公共交通の時間は距離からの推定です。実際の時間はカカオマップで確認してください。', openTransit:'🚇 カカオマップで乗換案内', walkMax:'自動モード:この距離までは徒歩', walkMaxHint:'それより遠い区間は車で計算します。ふたりに同じ設定が適用されます。', manageCats:'カテゴリー管理', catHint:'絵文字・名前・色を変えて、矢印で並べ替えできます。削除したカテゴリーのスポットは「その他」に移ります。', addCat:'+ カテゴリーを追加', done:'完了', newCat:'新しいカテゴリー', catNamePh:'カテゴリー名', moveUp:'上へ', moveDown:'下へ', cDeleteCat:'「{name}」を削除しますか?このカテゴリーのスポットは「その他」に移ります。', photo:'写真', photoUpload:'写真をアップ', photoRemove:'削除', photoUrlPh:'画像URL (https://…)', tPhotoFail:'画像を読み込めませんでした', errMap:'カカオマップを読み込めませんでした。ドメイン登録や地図の利用設定を確認してください。リストと同期はそのまま使えます。',
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
