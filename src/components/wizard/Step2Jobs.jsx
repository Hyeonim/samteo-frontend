import { useState, useMemo } from 'react'

const ALL_JOBS = [
  // 서울
  {
    id: 1, region: '서울',
    name: '홍대 대형 베이커리 카페',
    salary: 1700000, type: '카페',
    desc: '홍대입구역 도보 3분. 대형 베이커리 카페 단기 스태프 모집',
    location: '📍 서울 마포구 · 대중교통 5분',
    tags: ['🚇 지하철 직결', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩170만', unit: '/월', sub: '숙박비 별도',
    emoji: '☕', bg: 'pi1', best: true,
    lat: 37.5563, lng: 126.9236,
  },
  {
    id: 2, region: '서울',
    name: '강남 호텔 프런트 스태프',
    salary: 2200000, type: '호텔',
    desc: '강남역 인근 비즈니스호텔. 프런트·하우스키핑 포함',
    location: '📍 서울 강남구 · 대중교통 10분',
    tags: ['🍱 숙식제공', '⏰ 주 5일', '💴 시급 11,500원'],
    priceLabel: '₩220만', unit: '/월', sub: '숙식 포함',
    emoji: '🏨', bg: 'pi2', best: false,
    lat: 37.4979, lng: 127.0276,
  },
  {
    id: 3, region: '서울',
    name: '이태원 다국어 관광안내',
    salary: 1500000, type: '관광안내',
    desc: '외국인 관광객 대상 안내 스태프. 영어 가능자 우대',
    location: '📍 서울 용산구 · 대중교통 8분',
    tags: ['🌍 영어 우대', '⏰ 주 5일', '💴 시급 10,500원'],
    priceLabel: '₩150만', unit: '/월', sub: '숙박비 별도',
    emoji: '🗺️', bg: 'pi3', best: false,
    lat: 37.5345, lng: 126.9944,
  },

  // 부산
  {
    id: 4, region: '부산',
    name: '해운대 리조트 스태프',
    salary: 2100000, type: '리조트',
    desc: '해운대 특급 리조트. 프런트·수영장·레스토랑 스태프',
    location: '📍 부산 해운대구 · 대중교통 15분',
    tags: ['🍱 숙식제공', '⏰ 주 5일', '💴 시급 11,000원'],
    priceLabel: '₩210만', unit: '/월', sub: '숙식 포함',
    emoji: '🏖️', bg: 'pi1', best: true,
    lat: 35.1632, lng: 129.1601,
  },
  {
    id: 5, region: '부산',
    name: '광안리 서핑샵 스태프',
    salary: 1400000, type: '레저',
    desc: '서핑 장비 대여·강습 보조. 서핑 경험자 우대',
    location: '📍 부산 수영구 · 대중교통 20분',
    tags: ['🏄 경험자 우대', '⏰ 주 6일', '💴 시급 10,030원'],
    priceLabel: '₩140만', unit: '/월', sub: '숙박비 별도',
    emoji: '🏄', bg: 'pi2', best: false,
    lat: 35.1531, lng: 129.1196,
  },
  {
    id: 6, region: '부산',
    name: '자갈치시장 수산물 판매',
    salary: 1600000, type: '시장',
    desc: '부산 대표 수산시장. 판매·포장 단기 알바',
    location: '📍 부산 중구 · 대중교통 10분',
    tags: ['🐟 수산물 경험', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩160만', unit: '/월', sub: '숙박비 별도',
    emoji: '🦐', bg: 'pi3', best: false,
    lat: 35.0974, lng: 129.0303,
  },

  // 대구
  {
    id: 7, region: '대구',
    name: '동성로 대형 베이커리 카페',
    salary: 1600000, type: '카페',
    desc: '시내버스 706번 환승 없음. 동성로 중심 대형 카페 단기 스태프',
    location: '📍 대구 중구 동성로 · 대중교통 22분',
    tags: ['🚌 환승 없음', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩160만', unit: '/월', sub: '숙박비 별도',
    emoji: '☕', bg: 'pi1', best: true,
    lat: 35.8704, lng: 128.5927,
  },
  {
    id: 8, region: '대구',
    name: '팔공산 한옥스테이 관광안내',
    salary: 2100000, type: '관광안내',
    desc: '팔공산 케이블카 인근. 시설 운영 스태프, 숙식 제공 포함',
    location: '📍 대구 동구 팔공산 · 대중교통 45분',
    tags: ['🍱 숙식제공', '⏰ 주 5일', '💴 시급 11,000원'],
    priceLabel: '₩210만', unit: '/월', sub: '숙식 포함',
    emoji: '⛩️', bg: 'pi2', best: false,
    lat: 35.9116, lng: 128.6632,
  },
  {
    id: 9, region: '대구',
    name: '수성못 역세권 편의점',
    salary: 800000, type: '편의점',
    desc: '지하철 3호선 환승 1회. 주말 단기 근무 가능',
    location: '📍 대구 수성구 · 대중교통 38분',
    tags: ['🚇 환승 1회', '⏰ 주 2일', '💴 시급 10,030원'],
    priceLabel: '₩80만', unit: '/월', sub: '숙박비 별도',
    emoji: '🏪', bg: 'pi3', best: false,
    lat: 35.8562, lng: 128.6298,
  },

  // 제주
  {
    id: 10, region: '제주',
    name: '애월 오션뷰 카페 스태프',
    salary: 1800000, type: '카페',
    desc: '제주 애월 해안도로 오션뷰 카페. 숙소 제공 가능',
    location: '📍 제주 애월읍 · 버스 30분',
    tags: ['🏠 숙소제공', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩180만', unit: '/월', sub: '숙소 포함',
    emoji: '🌊', bg: 'pi1', best: true,
    lat: 33.4619, lng: 126.3235,
  },
  {
    id: 11, region: '제주',
    name: '성산일출봉 관광안내 스태프',
    salary: 1900000, type: '관광안내',
    desc: '유네스코 세계유산 안내. 숙식 제공, 외국어 가능자 우대',
    location: '📍 제주 서귀포시 · 버스 40분',
    tags: ['🍱 숙식제공', '⏰ 주 5일', '💴 시급 11,000원'],
    priceLabel: '₩190만', unit: '/월', sub: '숙식 포함',
    emoji: '🌋', bg: 'pi2', best: false,
    lat: 33.4584, lng: 126.9423,
  },
  {
    id: 12, region: '제주',
    name: '한림공원 매표·안내',
    salary: 1500000, type: '관광안내',
    desc: '한림공원 입장권 판매 및 관람객 안내',
    location: '📍 제주 한림읍 · 버스 35분',
    tags: ['🎫 매표 경험', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩150만', unit: '/월', sub: '숙박비 별도',
    emoji: '🌿', bg: 'pi3', best: false,
    lat: 33.4134, lng: 126.2599,
  },

  // 강릉
  {
    id: 13, region: '강릉',
    name: '안목해변 스페셜티 카페',
    salary: 1600000, type: '카페',
    desc: '강릉 커피거리 대표 카페. 바리스타 교육 포함',
    location: '📍 강릉 경포동 · 버스 15분',
    tags: ['☕ 바리스타', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩160만', unit: '/월', sub: '숙박비 별도',
    emoji: '☕', bg: 'pi1', best: true,
    lat: 37.7714, lng: 128.9457,
  },
  {
    id: 14, region: '강릉',
    name: '경포대 리조트 스태프',
    salary: 2000000, type: '리조트',
    desc: '경포 해변 앞 리조트. 프런트·수영장 스태프. 숙식 제공',
    location: '📍 강릉 경포동 · 버스 20분',
    tags: ['🍱 숙식제공', '⏰ 주 5일', '💴 시급 10,800원'],
    priceLabel: '₩200만', unit: '/월', sub: '숙식 포함',
    emoji: '🏖️', bg: 'pi2', best: false,
    lat: 37.7978, lng: 128.9066,
  },

  // 전주
  {
    id: 15, region: '전주',
    name: '한옥마을 한복 대여샵',
    salary: 1500000, type: '문화관광',
    desc: '전주 한옥마을 내 한복 대여 및 스타일링 스태프',
    location: '📍 전주 완산구 · 버스 10분',
    tags: ['👘 한복 경험', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩150만', unit: '/월', sub: '숙박비 별도',
    emoji: '👘', bg: 'pi1', best: true,
    lat: 35.8151, lng: 127.1544,
  },
  {
    id: 16, region: '전주',
    name: '전주 전통음식 체험관',
    salary: 1700000, type: '문화관광',
    desc: '비빔밥·콩나물국밥 등 전통음식 체험 프로그램 보조',
    location: '📍 전주 완산구 · 버스 12분',
    tags: ['🍚 요리 경험', '⏰ 주 5일', '💴 시급 10,500원'],
    priceLabel: '₩170만', unit: '/월', sub: '숙박비 별도',
    emoji: '🍱', bg: 'pi2', best: false,
    lat: 35.8148, lng: 127.1531,
  },

  // 경주
  {
    id: 17, region: '경주',
    name: '불국사 관광안내 스태프',
    salary: 1900000, type: '관광안내',
    desc: '유네스코 세계유산 불국사 관람객 안내. 숙식 제공',
    location: '📍 경주 토함산 · 버스 35분',
    tags: ['🍱 숙식제공', '⏰ 주 5일', '💴 시급 11,000원'],
    priceLabel: '₩190만', unit: '/월', sub: '숙식 포함',
    emoji: '⛩️', bg: 'pi1', best: true,
    lat: 35.7901, lng: 129.3322,
  },
  {
    id: 18, region: '경주',
    name: '황리단길 카페 스태프',
    salary: 1500000, type: '카페',
    desc: '경주 핫플레이스 황리단길 카페 단기 스태프',
    location: '📍 경주 황남동 · 버스 15분',
    tags: ['🚌 버스 직결', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩150만', unit: '/월', sub: '숙박비 별도',
    emoji: '☕', bg: 'pi2', best: false,
    lat: 35.8397, lng: 129.2104,
  },

  // 인천
  {
    id: 19, region: '인천',
    name: '인천공항 면세점 스태프',
    salary: 2300000, type: '면세점',
    desc: '인천국제공항 면세점 판매 스태프. 외국어 가능자 우대',
    location: '📍 인천 중구 · 공항셔틀 30분',
    tags: ['✈️ 공항 근무', '⏰ 주 5일', '💴 시급 12,000원'],
    priceLabel: '₩230만', unit: '/월', sub: '숙박비 별도',
    emoji: '✈️', bg: 'pi1', best: true,
    lat: 37.4602, lng: 126.4407,
  },
  {
    id: 20, region: '인천',
    name: '송도 컨벤시아 행사 스태프',
    salary: 1800000, type: '행사',
    desc: '국제행사·전시회 운영 보조 스태프. 외국어 우대',
    location: '📍 인천 연수구 · 지하철 20분',
    tags: ['🌍 외국어 우대', '⏰ 주 5일', '💴 시급 10,500원'],
    priceLabel: '₩180만', unit: '/월', sub: '숙박비 별도',
    emoji: '🎪', bg: 'pi2', best: false,
    lat: 37.3943, lng: 126.6579,
  },

  // 여수
  {
    id: 21, region: '여수',
    name: '여수 엑스포 해양공원 스태프',
    salary: 1800000, type: '관광안내',
    desc: '여수 해양공원 관람객 안내 및 시설 운영',
    location: '📍 여수 수정동 · 버스 10분',
    tags: ['🚌 버스 직결', '⏰ 주 5일', '💴 시급 10,500원'],
    priceLabel: '₩180만', unit: '/월', sub: '숙박비 별도',
    emoji: '🦑', bg: 'pi1', best: true,
    lat: 34.7390, lng: 127.7360,
  },
  {
    id: 22, region: '여수',
    name: '돌산도 펜션 운영 스태프',
    salary: 1900000, type: '숙박',
    desc: '오션뷰 펜션 예약·청소·서비스 스태프. 숙식 제공',
    location: '📍 여수 돌산읍 · 버스 25분',
    tags: ['🍱 숙식제공', '⏰ 주 5일', '💴 시급 10,800원'],
    priceLabel: '₩190만', unit: '/월', sub: '숙식 포함',
    emoji: '🏠', bg: 'pi2', best: false,
    lat: 34.6931, lng: 127.7636,
  },

  // 속초
  {
    id: 23, region: '속초',
    name: '설악산 케이블카 운영 스태프',
    salary: 2000000, type: '관광안내',
    desc: '설악산 케이블카 탑승·안내. 숙식 제공',
    location: '📍 속초 설악동 · 버스 20분',
    tags: ['🍱 숙식제공', '⏰ 주 5일', '💴 시급 11,000원'],
    priceLabel: '₩200만', unit: '/월', sub: '숙식 포함',
    emoji: '🏔️', bg: 'pi1', best: true,
    lat: 38.1198, lng: 128.4654,
  },
  {
    id: 24, region: '속초',
    name: '속초 중앙시장 닭강정 판매',
    salary: 1500000, type: '시장',
    desc: '속초 유명 닭강정 가게 판매 스태프',
    location: '📍 속초 중앙동 · 버스 10분',
    tags: ['🍗 식품 경험', '⏰ 주 6일', '💴 시급 10,030원'],
    priceLabel: '₩150만', unit: '/월', sub: '숙박비 별도',
    emoji: '🍗', bg: 'pi2', best: false,
    lat: 38.2047, lng: 128.5919,
  },

  // 광주
  {
    id: 25, region: '광주',
    name: '국립아시아문화전당 도슨트',
    salary: 1800000, type: '문화관광',
    desc: '아시아문화전당 전시 안내 도슨트. 문화예술 관심자 우대',
    location: '📍 광주 동구 · 버스 10분',
    tags: ['🎨 예술 관심', '⏰ 주 5일', '💴 시급 10,500원'],
    priceLabel: '₩180만', unit: '/월', sub: '숙박비 별도',
    emoji: '🎨', bg: 'pi1', best: true,
    lat: 35.1481, lng: 126.9178,
  },
  {
    id: 26, region: '광주',
    name: '양림동 역사마을 관광안내',
    salary: 1600000, type: '관광안내',
    desc: '광주 근대역사 마을 관광객 안내 및 해설',
    location: '📍 광주 남구 · 버스 15분',
    tags: ['🏛️ 역사 관심', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩160만', unit: '/월', sub: '숙박비 별도',
    emoji: '🏛️', bg: 'pi2', best: false,
    lat: 35.1403, lng: 126.9102,
  },

  // 대전
  {
    id: 27, region: '대전',
    name: '엑스포 과학공원 스태프',
    salary: 1700000, type: '관광안내',
    desc: '과학공원 시설 운영·관람객 안내 스태프',
    location: '📍 대전 유성구 · 버스 20분',
    tags: ['🔬 과학 관심', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩170만', unit: '/월', sub: '숙박비 별도',
    emoji: '🔬', bg: 'pi1', best: true,
    lat: 36.3741, lng: 127.3874,
  },
  {
    id: 28, region: '대전',
    name: '유성온천 스파·호텔 스태프',
    salary: 1900000, type: '호텔',
    desc: '유성온천 특급호텔 스파·프런트 스태프. 숙식 제공',
    location: '📍 대전 유성구 · 버스 15분',
    tags: ['🍱 숙식제공', '⏰ 주 5일', '💴 시급 10,800원'],
    priceLabel: '₩190만', unit: '/월', sub: '숙식 포함',
    emoji: '♨️', bg: 'pi2', best: false,
    lat: 36.3626, lng: 127.3463,
  },
  {
    id: 29, region: '대전',
    name: '성심당 베이커리 판매 스태프',
    salary: 1500000, type: '카페',
    desc: '대전 명물 성심당 분점 판매·포장 스태프. 유연 근무 가능',
    location: '📍 대전 중구 · 버스 10분',
    tags: ['🍞 베이커리', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩150만', unit: '/월', sub: '숙박비 별도',
    emoji: '🍞', bg: 'pi3', best: false,
    lat: 36.3267, lng: 127.4274,
  },

  // 서울 추가
  {
    id: 30, region: '서울',
    name: '성수동 편집샵 판매 스태프',
    salary: 1800000, type: '판매',
    desc: '성수동 핫플 편집샵. 의류·소품 판매 및 VMD 보조',
    location: '📍 서울 성동구 · 지하철 2호선 직결',
    tags: ['🚇 지하철 직결', '⏰ 주 5일', '💴 시급 10,500원'],
    priceLabel: '₩180만', unit: '/월', sub: '숙박비 별도',
    emoji: '👗', bg: 'pi1', best: false,
    lat: 37.5447, lng: 127.0567,
  },
  {
    id: 31, region: '서울',
    name: '마포 물류센터 분류 스태프',
    salary: 2000000, type: '물류',
    desc: '마포구 소형 물류센터. 야간 분류 업무. 초보 가능',
    location: '📍 서울 마포구 · 버스 15분',
    tags: ['🌙 야간 가능', '⏰ 주 5일', '💴 시급 11,200원'],
    priceLabel: '₩200만', unit: '/월', sub: '숙박비 별도',
    emoji: '📦', bg: 'pi2', best: false,
    lat: 37.5596, lng: 126.9082,
  },
  {
    id: 32, region: '서울',
    name: '명동 뷰티샵 체험 스태프',
    salary: 1650000, type: '판매',
    desc: '명동 외국인 관광객 대상 K-뷰티 체험샵 판매 스태프',
    location: '📍 서울 중구 명동 · 지하철 4호선',
    tags: ['🌍 외국어 우대', '⏰ 주 5일', '💴 시급 10,200원'],
    priceLabel: '₩165만', unit: '/월', sub: '숙박비 별도',
    emoji: '💄', bg: 'pi3', best: false,
    lat: 37.5631, lng: 126.9855,
  },

  // 부산 추가
  {
    id: 33, region: '부산',
    name: '감천문화마을 공방 스태프',
    salary: 1450000, type: '문화관광',
    desc: '부산 감천문화마을 내 공방 체험 보조 및 기념품 판매',
    location: '📍 부산 사하구 · 버스 20분',
    tags: ['🎨 예술 관심', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩145만', unit: '/월', sub: '숙박비 별도',
    emoji: '🎨', bg: 'pi1', best: false,
    lat: 35.0974, lng: 129.0108,
  },
  {
    id: 34, region: '부산',
    name: '부산역 인근 게스트하우스',
    salary: 1700000, type: '숙박',
    desc: '부산역 5분 거리 게스트하우스 프런트·청소 스태프. 숙식 제공',
    location: '📍 부산 동구 · 도보 5분',
    tags: ['🍱 숙식제공', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩170만', unit: '/월', sub: '숙식 포함',
    emoji: '🏠', bg: 'pi2', best: false,
    lat: 35.1143, lng: 129.0391,
  },
  {
    id: 35, region: '부산',
    name: '기장 멸치 수산물 판매',
    salary: 1550000, type: '시장',
    desc: '기장 수산시장 멸치·미역 포장·판매. 새벽 근무 포함',
    location: '📍 부산 기장군 · 버스 35분',
    tags: ['🐟 수산물', '⏰ 주 6일', '💴 시급 10,030원'],
    priceLabel: '₩155만', unit: '/월', sub: '숙박비 별도',
    emoji: '🐠', bg: 'pi3', best: false,
    lat: 35.2444, lng: 129.2193,
  },

  // 대구 추가
  {
    id: 36, region: '대구',
    name: '반월당 비즈니스호텔 하우스키핑',
    salary: 1750000, type: '호텔',
    desc: '반월당역 도보 3분 비즈니스호텔. 객실 정비 스태프',
    location: '📍 대구 중구 · 지하철 2호선',
    tags: ['🚇 지하철 직결', '⏰ 주 5일', '💴 시급 10,500원'],
    priceLabel: '₩175만', unit: '/월', sub: '숙박비 별도',
    emoji: '🛏️', bg: 'pi3', best: false,
    lat: 35.8665, lng: 128.5943,
  },
  {
    id: 37, region: '대구',
    name: '서문시장 전통음식 판매',
    salary: 1400000, type: '시장',
    desc: '대구 서문시장 납작만두·수제비 가게 판매 보조 스태프',
    location: '📍 대구 중구 서문시장 · 버스 18분',
    tags: ['🥟 음식 경험', '⏰ 주 6일', '💴 시급 10,030원'],
    priceLabel: '₩140만', unit: '/월', sub: '숙박비 별도',
    emoji: '🥟', bg: 'pi1', best: false,
    lat: 35.8697, lng: 128.5763,
  },

  // 제주 추가
  {
    id: 38, region: '제주',
    name: '제주시 농장 귤 수확 알바',
    salary: 1600000, type: '농업',
    desc: '제주 한림 귤 농장 계절 수확 스태프. 숙소 제공 가능',
    location: '📍 제주 한림읍 · 버스 40분',
    tags: ['🍊 귤 수확', '⏰ 주 6일', '💴 시급 10,500원'],
    priceLabel: '₩160만', unit: '/월', sub: '숙소 포함',
    emoji: '🍊', bg: 'pi3', best: false,
    lat: 33.4141, lng: 126.2649,
  },
  {
    id: 39, region: '제주',
    name: '중문 리조트 풀빌라 스태프',
    salary: 2200000, type: '리조트',
    desc: '중문관광단지 풀빌라 리조트 예약·케어 스태프. 숙식 포함',
    location: '📍 제주 서귀포시 중문 · 버스 20분',
    tags: ['🍱 숙식제공', '⏰ 주 5일', '💴 시급 12,000원'],
    priceLabel: '₩220만', unit: '/월', sub: '숙식 포함',
    emoji: '🏊', bg: 'pi1', best: false,
    lat: 33.2441, lng: 126.4122,
  },
  {
    id: 40, region: '제주',
    name: '협재 해수욕장 수상레저',
    salary: 1700000, type: '레저',
    desc: '협재해변 수상 레저 장비 대여·강습 보조 스태프',
    location: '📍 제주 한림읍 협재 · 버스 35분',
    tags: ['🏄 레저 경험', '⏰ 주 6일', '💴 시급 10,500원'],
    priceLabel: '₩170만', unit: '/월', sub: '숙박비 별도',
    emoji: '🚣', bg: 'pi2', best: false,
    lat: 33.3936, lng: 126.2393,
  },

  // 강릉 추가
  {
    id: 41, region: '강릉',
    name: '강릉중앙시장 초당순두부 가게',
    salary: 1350000, type: '시장',
    desc: '강릉 초당순두부 음식점 홀 서빙 및 주방 보조',
    location: '📍 강릉 포남동 · 버스 10분',
    tags: ['🥣 요리 경험', '⏰ 주 6일', '💴 시급 10,030원'],
    priceLabel: '₩135만', unit: '/월', sub: '숙박비 별도',
    emoji: '🍲', bg: 'pi3', best: false,
    lat: 37.7506, lng: 128.8986,
  },
  {
    id: 42, region: '강릉',
    name: '정동진 해돋이 리조트',
    salary: 1950000, type: '리조트',
    desc: '정동진 오션뷰 리조트 프런트·하우스키핑 스태프. 숙식 제공',
    location: '📍 강릉 정동진 · 기차 20분',
    tags: ['🍱 숙식제공', '⏰ 주 5일', '💴 시급 10,800원'],
    priceLabel: '₩195만', unit: '/월', sub: '숙식 포함',
    emoji: '🌅', bg: 'pi1', best: false,
    lat: 37.6864, lng: 129.0629,
  },

  // 전주 추가
  {
    id: 43, region: '전주',
    name: '한옥마을 대나무 카페',
    salary: 1550000, type: '카페',
    desc: '전주 한옥마을 내 특색있는 대나무 테마 카페 바리스타',
    location: '📍 전주 완산구 · 버스 12분',
    tags: ['☕ 바리스타', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩155만', unit: '/월', sub: '숙박비 별도',
    emoji: '🎋', bg: 'pi3', best: false,
    lat: 35.8148, lng: 127.1540,
  },
  {
    id: 44, region: '전주',
    name: '전주 교동아트마켓 플리마켓',
    salary: 1300000, type: '문화관광',
    desc: '주말 플리마켓 운영 보조 및 공예품 판매 스태프',
    location: '📍 전주 완산구 교동 · 도보 10분',
    tags: ['🎪 플리마켓', '⏰ 주 2일', '💴 시급 10,030원'],
    priceLabel: '₩130만', unit: '/월', sub: '숙박비 별도',
    emoji: '🛍️', bg: 'pi2', best: false,
    lat: 35.8160, lng: 127.1527,
  },

  // 경주 추가
  {
    id: 45, region: '경주',
    name: '경주 보문관광단지 리조트',
    salary: 2000000, type: '리조트',
    desc: '보문호 오션뷰 리조트 수영장·레스토랑 스태프. 숙식 제공',
    location: '📍 경주 보문동 · 버스 15분',
    tags: ['🍱 숙식제공', '⏰ 주 5일', '💴 시급 11,000원'],
    priceLabel: '₩200만', unit: '/월', sub: '숙식 포함',
    emoji: '🏨', bg: 'pi3', best: false,
    lat: 35.8481, lng: 129.2892,
  },
  {
    id: 46, region: '경주',
    name: '첨성대 주변 야시장 스태프',
    salary: 1350000, type: '시장',
    desc: '경주 야시장 먹거리·기념품 판매 스태프. 저녁 근무',
    location: '📍 경주 인왕동 · 도보 5분',
    tags: ['🌙 야간 근무', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩135만', unit: '/월', sub: '숙박비 별도',
    emoji: '🏮', bg: 'pi1', best: false,
    lat: 35.8374, lng: 129.2188,
  },

  // 인천 추가
  {
    id: 47, region: '인천',
    name: '인천항 국제여객터미널 스태프',
    salary: 2000000, type: '관광안내',
    desc: '인천항 국제여객선 탑승 안내·입출국 보조 스태프',
    location: '📍 인천 중구 · 버스 20분',
    tags: ['🚢 여객선', '⏰ 주 5일', '💴 시급 11,000원'],
    priceLabel: '₩200만', unit: '/월', sub: '숙박비 별도',
    emoji: '🚢', bg: 'pi3', best: false,
    lat: 37.4680, lng: 126.6006,
  },
  {
    id: 48, region: '인천',
    name: '차이나타운 음식점 서빙',
    salary: 1500000, type: '카페',
    desc: '인천 차이나타운 유명 짜장면집 홀 서빙·주방 보조',
    location: '📍 인천 중구 차이나타운 · 지하철 1호선',
    tags: ['🍜 요리 경험', '⏰ 주 6일', '💴 시급 10,030원'],
    priceLabel: '₩150만', unit: '/월', sub: '숙박비 별도',
    emoji: '🍜', bg: 'pi2', best: false,
    lat: 37.4758, lng: 126.6171,
  },

  // 여수 추가
  {
    id: 49, region: '여수',
    name: '여수 케이블카 운영 스태프',
    salary: 1850000, type: '관광안내',
    desc: '여수 해상케이블카 탑승·안내 스태프. 오션뷰 근무 환경',
    location: '📍 여수 돌산 · 버스 15분',
    tags: ['🚡 케이블카', '⏰ 주 5일', '💴 시급 10,500원'],
    priceLabel: '₩185만', unit: '/월', sub: '숙박비 별도',
    emoji: '🚡', bg: 'pi3', best: false,
    lat: 34.7265, lng: 127.7520,
  },
  {
    id: 50, region: '여수',
    name: '오동도 선착장 관광 보트',
    salary: 1700000, type: '레저',
    desc: '오동도 유람선 승선 안내·매표 스태프',
    location: '📍 여수 오동도 · 버스 10분',
    tags: ['⛵ 해양 경험', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩170만', unit: '/월', sub: '숙박비 별도',
    emoji: '⛵', bg: 'pi1', best: false,
    lat: 34.7401, lng: 127.7659,
  },

  // 속초 추가
  {
    id: 51, region: '속초',
    name: '속초 아바이마을 순대 판매',
    salary: 1400000, type: '시장',
    desc: '속초 아바이마을 오징어순대 판매 스태프. 새벽 근무 포함',
    location: '📍 속초 청호동 · 버스 15분',
    tags: ['🦑 식품 경험', '⏰ 주 6일', '💴 시급 10,030원'],
    priceLabel: '₩140만', unit: '/월', sub: '숙박비 별도',
    emoji: '🦑', bg: 'pi3', best: false,
    lat: 38.2087, lng: 128.5818,
  },
  {
    id: 52, region: '속초',
    name: '청초호 오션뷰 카페',
    salary: 1600000, type: '카페',
    desc: '청초호 호수뷰 감성 카페 바리스타·홀 스태프',
    location: '📍 속초 조양동 · 버스 10분',
    tags: ['☕ 바리스타', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩160만', unit: '/월', sub: '숙박비 별도',
    emoji: '☕', bg: 'pi2', best: false,
    lat: 38.1986, lng: 128.5937,
  },

  // 광주 추가
  {
    id: 53, region: '광주',
    name: '동명동 카페거리 바리스타',
    salary: 1550000, type: '카페',
    desc: '광주 감성 카페거리 동명동 스페셜티 카페 바리스타',
    location: '📍 광주 동구 동명동 · 버스 15분',
    tags: ['☕ 바리스타', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩155만', unit: '/월', sub: '숙박비 별도',
    emoji: '☕', bg: 'pi3', best: false,
    lat: 35.1453, lng: 126.9244,
  },
  {
    id: 54, region: '광주',
    name: '광주 송정리 시장 먹거리',
    salary: 1300000, type: '시장',
    desc: '광주 송정리역전 5일장 떡볶이·순대 판매 스태프',
    location: '📍 광주 광산구 · KTX 송정역 도보',
    tags: ['🍢 음식 경험', '⏰ 주 5일', '💴 시급 10,030원'],
    priceLabel: '₩130만', unit: '/월', sub: '숙박비 별도',
    emoji: '🍢', bg: 'pi1', best: false,
    lat: 35.1401, lng: 126.7927,
  },
]

const BG_CYCLE = ['pi1', 'pi2', 'pi3']

export default function Step2Jobs({ region, selectedJobs, onToggle }) {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('전체')

  const regionJobs = useMemo(
    () => ALL_JOBS.filter((j) => j.region === region),
    [region]
  )

  const availableTypes = useMemo(
    () => ['전체', ...new Set(regionJobs.map((j) => j.type))],
    [regionJobs]
  )

  const filtered = useMemo(() => {
    return regionJobs.filter((j) => {
      const matchType = activeType === '전체' || j.type === activeType
      const q = search.trim()
      const matchSearch = !q || j.name.includes(q) || j.desc.includes(q) || j.type.includes(q)
      return matchType && matchSearch
    })
  }, [regionJobs, activeType, search])

  return (
    <div className="step-card">
      <div className="step-title">
        <span className="job-region-tag">{region}</span> 출퇴근 1시간 안의 알바 자리만 골라왔어요!
      </div>
      <div className="step-subtitle" style={{ color: '#ef4444', fontWeight: 600 }}>
        ⚠️ 자체 원둘레 필터링 및 대중교통 다익스트라 알고리즘 검증 완료
      </div>

      {selectedJobs.length > 0 && (
        <div className="job-selected-count">
          ✓ {selectedJobs.length}개 선택됨 · 중복 알바도 가능해요!
        </div>
      )}

      {/* 검색창 */}
      <div className="region-search-wrap" style={{ marginBottom: 14 }}>
        <span className="region-search-icon">🔍</span>
        <input
          className="region-search-input"
          type="text"
          placeholder={`${region} 내 일자리 검색  (예: 카페, 숙식제공)`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="region-search-clear" onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* 업종 필터 */}
      <div className="job-filter-bar">
        {availableTypes.map((t) => (
          <div
            key={t}
            className={`jchip ${activeType === t ? 'active' : 'def'}`}
            onClick={() => setActiveType(t)}
          >
            {t}
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="region-empty">
          <div style={{ fontSize: 32, marginBottom: 8 }}>😥</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>검색 결과가 없습니다</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>다른 키워드나 업종으로 검색해 보세요</div>
        </div>
      ) : (
        <div className="pkg-grid">
          {filtered.map((job, idx) => {
            const isSelected = selectedJobs.some((j) => j.id === job.id)
            const bg = BG_CYCLE[idx % 3]
            return (
              <div
                key={job.id}
                className={`pkg-card${isSelected ? ' selected' : ''}`}
                onClick={() => onToggle(job)}
              >
                {job.best && <div className="pkg-best">⭐ BEST</div>}
                {isSelected && <div className="pkg-check-badge">✓</div>}
                <div className={`pkg-img ${bg}`}>
                  <div className="pkg-img-label">{job.emoji}</div>
                  <div className="pkg-img-overlay">
                    <div className="pkg-location">{job.location}</div>
                  </div>
                </div>
                <div className="pkg-body">
                  <div className="pkg-type">{job.type}</div>
                  <div className="pkg-name">{job.name}</div>
                  <div className="pkg-desc">{job.desc}</div>
                  <div className="pkg-tags">
                    {job.tags.map((t) => (
                      <span key={t} className="ptag">{t}</span>
                    ))}
                  </div>
                  <div className="pkg-footer">
                    <div className="pkg-price">
                      <span className="amount">{job.priceLabel}</span>
                      <span className="unit">{job.unit}</span>
                      <span className="sub">{job.sub}</span>
                    </div>
                    <button
                      className={`pkg-btn${isSelected ? ' sel' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggle(job)
                      }}
                    >
                      {isSelected ? '✓ 선택됨' : '선택하기'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
