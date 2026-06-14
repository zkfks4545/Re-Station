import type { Cocktail, CocktailData } from '../../types.js'
import type {
  CocktailDatabase,
  CocktailRecord,
  FeatureKey,
  PartnerBar,
  TastePreference,
} from '../../types/cocktail-db.js'
import {
  isSignatureCocktail,
} from '../../types/cocktail-db.js'
import rawDb from '../../data/cocktail-db.json'

export const cocktailDatabase = rawDb as CocktailDatabase

const legacyCocktails: Cocktail[] = [
  {
    id: 'mojito',
    name: '모히토',
    nameEn: 'Mojito',
    aliases: ['모히또'],
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: true },
    aroma: ['시트러스', '허브', '민트'],
    base: '럼',
    ingredients: ['럼', '라임', '설탕', '민트', '소다수'],
    recipe: [
      { ingredient: '럼', measure: '2-3 oz' },
      { ingredient: '라임', measure: 'Juice of 1' },
      { ingredient: '설탕', measure: '2 tsp' },
      { ingredient: '민트', measure: '2-4' },
      { ingredient: '소다수', measure: '' },
    ],
    recipeText: 'Muddle mint leaves with sugar and lime juice. Add a splash of soda water and fill the glass with cracked ice. Pour the rum and top with soda water. Garnish and serve with straw.',
    story: '아, 모히토라면… 이 친구는 쿠바 혁명 시절 하바나의 작은 바에서 태어났어요. 헤밍웨이가 특히 사랑해서 "나의 모히토"라고 부르며 즐겨 마셨다는 이야기가 전해집니다. 민트 향이 코끝을 스치는 이 한 잔, 참 청량하죠? 더운 여름날 딱 어울리는 칵테일이에요.',
    vibe: '청량하고 상쾌한 여름의 맛',
    popCulture: '헤밍웨이 소설 "노인과 바다"를 집필할 때 즐겨 마심',
    image: 'https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg',
    glass: 'Highball glass',
    category: 'Cocktail',
    alcoholic: 'Alcoholic',
    apiId: '11000',
  },
  {
    id: 'old-fashioned',
    name: '올드 패션드',
    nameEn: 'Old Fashioned',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 4, carbonated: false },
    aroma: ['스모키', '스파이시', '견과류'],
    base: '위스키',
    ingredients: ['버번', '앙고스투라 비터', '설탕', '물'],
    recipe: [
      { ingredient: '버번', measure: '4.5 cL' },
      { ingredient: '앙고스투라 비터', measure: '2 dashes' },
      { ingredient: '설탕', measure: '1 cube' },
      { ingredient: '물', measure: 'dash' },
    ],
    recipeText: 'Place sugar cube in old fashioned glass and saturate with bitters, add a dash of plain water. Muddle until dissolved. Fill the glass with ice cubes and add whiskey. Garnish with orange twist, and a cocktail cherry.',
    story: '올드 패션드는 정말 클래식 중의 클래식이에요. 19세기 미국 켄터키에서 처음 만들어진 칵테일인데, 위스키 본연의 맛을 가장 잘 살린다는 평가를 받고 있어요. 시간이 깊어질수록 느껴지는 그 풍미, 한 번 빠지면 헤어나오기 힘들답니다.',
    vibe: '시간이 깊어질수록 느껴지는 클래식한 풍미',
    popCulture: '드라마 "매드맨"에서 돈 드레이퍼가 즐겨 마심',
    image: 'https://www.thecocktaildb.com/images/media/drink/vrwquq1478252802.jpg',
    glass: 'Old-fashioned glass',
    category: 'Cocktail',
    alcoholic: 'Alcoholic',
    apiId: '11001',
  },
  {
    id: 'french-75',
    name: '프렌치 75',
    nameEn: 'French 75',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: true },
    aroma: ['시트러스', '플로럴'],
    base: '진',
    ingredients: ['진', '설탕', '레몬 주스', '샴페인', 'Orange', '체리'],
    recipe: [
      { ingredient: '진', measure: '1 1/2 oz' },
      { ingredient: '설탕', measure: '2 tsp superfine' },
      { ingredient: '레몬 주스', measure: '1 1/2 oz' },
      { ingredient: '샴페인', measure: '4 oz Chilled' },
      { ingredient: 'Orange', measure: '1' },
      { ingredient: '체리', measure: '1' },
    ],
    recipeText: 'Combine gin, sugar, and lemon juice in a cocktail shaker filled with ice. Shake vigorously and strain into a chilled champagne glass. Top up with Champagne. Stir gently.',
    story: '이름부터 멋지죠? 프렌치 75는 1차 세계대전 당시 프랑스에서 만들어진 칵테일이에요. 75mm 포를 맞은 듯한 강력한 느낌에서 이름이 붙여졌다고 해요. 샴페인의 기포가 톡톡 터지면서 축제 같은 기분을 느끼게 해주는 칵테일이랍니다.',
    vibe: '축제와 승리의 기포가 터지는 맛',
    image: 'https://www.thecocktaildb.com/images/media/drink/hrxfbl1606773109.jpg',
    glass: 'Collins glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '17197',
  },
  {
    id: 'ramos-gin-fizz',
    name: '라모스 진 피즈',
    nameEn: 'Ramos Gin Fizz',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: true },
    aroma: ['시트러스', '플로럴', '크리미'],
    base: '진',
    ingredients: ['진', '레몬 주스', 'Sugar Syrup', '크림', '달걀 흰자', 'Vanilla extract', '소다수'],
    recipe: [
      { ingredient: '진', measure: '4.5 cL' },
      { ingredient: '레몬 주스', measure: '3 cl' },
      { ingredient: 'Sugar Syrup', measure: '3 cl' },
      { ingredient: '크림', measure: '6 cl' },
      { ingredient: '달걀 흰자', measure: '1' },
      { ingredient: 'Vanilla extract', measure: '2 drop' },
      { ingredient: '소다수', measure: '2 cl' },
    ],
    recipeText: 'Prepare all the ingredients on the counter to be able to work well and quickly, especially the cream and egg white. Pour all the ingredients into a shaker. Shake vigorously for 1 minute: cream and egg white must be mixed perfectly, so don\'t rush. Now open the shaker and put some ice and shake for 1-2 minutes. It depends on how long you can resist! Pour into a highball glass, add a splash of soda and garnish to taste. Ramos Gin Fizz was once drunk as an invigorating drink or even as a breakfast, try it as an aperitif and after dinner and you will discover a little gem now lost.',
    story: '라모스 진 피즈는 1888년 뉴올리언스에서 헨리 라모스라는 바텐더가 만든 칵테일이에요. 하루에 쉐이커를 35만 번이나 흔들었다는 전설이 있답니다. 그래서인지 크리미하고 부드러운 거품이 정말 환상적이에요.',
    vibe: '부드럽고 크리미한 달콤함',
    image: 'https://www.thecocktaildb.com/images/media/drink/967t911643844053.jpg',
    glass: 'Highball glass',
    category: 'Cocktail',
    alcoholic: 'Alcoholic',
    apiId: '178367',
  },
  {
    id: 'negroni',
    name: '네그로니',
    nameEn: 'Negroni',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 4, carbonated: false },
    aroma: ['허브', '스파이시', '비터'],
    base: '진',
    ingredients: ['진', '캄파리', '스위트 베르무트'],
    recipe: [
      { ingredient: '진', measure: '1 oz' },
      { ingredient: '캄파리', measure: '1 oz' },
      { ingredient: '스위트 베르무트', measure: '1 oz' },
    ],
    recipeText: 'Stir into glass over ice, garnish and serve.',
    story: '네그로니는 1919년 이탈리아 피렌체에서 카밀로 네그로니 백작이 주문한 칵테일이에요. 쓴맛이 강하지만 그 속에 숨겨진 깊은 매력이 있죠. 어른의 맛을 아는 분들이 자주 찾는 칵테일입니다. 한 잔 하시겠어요?',
    vibe: '쓴맛 속에 숨겨진 깊은 매력',
    image: 'https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg',
    glass: 'Old-fashioned glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '11003',
  },
  {
    id: 'margarita',
    name: '마가리타',
    nameEn: 'Margarita',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: false },
    aroma: ['시트러스', '과일'],
    base: '데킬라',
    ingredients: ['데킬라', '트리플 섹', '라임 주스', '소금'],
    recipe: [
      { ingredient: '데킬라', measure: '1 1/2 oz' },
      { ingredient: '트리플 섹', measure: '1/2 oz' },
      { ingredient: '라임 주스', measure: '1 oz' },
      { ingredient: '소금', measure: '' },
    ],
    recipeText: 'Rub the rim of the glass with the lime slice to make the salt stick to it. Take care to moisten only the outer rim and sprinkle the salt on it. The salt should present to the lips of the imbiber and never mix into the cocktail. Shake the other ingredients with ice, then carefully pour into the glass.',
    story: '마가리타는 1938년 멕시코의 한 바텐더가 여성 손님을 위해 만든 칵테일이에요. 데킬라의 강렬함과 라임의 상큼함이 만나 환상적인 조화를 이루죠. 잔 가장자리의 소금이 단맛과 짠맛의 균형을 정말 멋지게 잡아준답니다.',
    vibe: '따사로운 태양 아래의 휴식',
    image: 'https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg',
    glass: 'Cocktail glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '11007',
  },
  {
    id: 'cosmopolitan',
    name: '코스모폴리탄',
    nameEn: 'Cosmopolitan',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: false },
    aroma: ['시트러스', '과일', '베리'],
    base: '보드카',
    ingredients: ['보드카', '라임 주스', '쿠앵트로', '크랜베리 주스'],
    recipe: [
      { ingredient: '보드카', measure: '1 1/4 oz' },
      { ingredient: '라임 주스', measure: '1/4 oz' },
      { ingredient: '쿠앵트로', measure: '1/4 oz' },
      { ingredient: '크랜베리 주스', measure: '1/4 cup' },
    ],
    recipeText: 'Add all ingredients into cocktail shaker filled with ice. Shake well and double strain into large cocktail glass. Garnish with lime wheel.',
    story: '코스모폴리탄은 1980년대 뉴욕의 게이 바에서 처음 탄생했어요. 그런데 "섹스 앤 더 시티"에 나오면서 전 세계적으로 유명해졌죠. 핑크빛이 정말 예쁘고, 크랜베리의 새콤달콤함이 매력적인 칵테일이에요.',
    vibe: '도시적이고 세련된 핑크빛 우아함',
    popCulture: '드라마 "섹스 앤 더 시티"에서 캐리가 즐겨 마심',
    image: 'https://www.thecocktaildb.com/images/media/drink/kpsajh1504368362.jpg',
    glass: 'Cocktail glass',
    category: 'Cocktail',
    alcoholic: 'Alcoholic',
    apiId: '17196',
  },
  {
    id: 'martini',
    name: '마티니',
    nameEn: 'Martini',
    aliases: ['마르티니'],
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 4, carbonated: false },
    aroma: ['허브', '드라이'],
    base: '진',
    ingredients: ['진', '드라이 베르무트', 'Olive'],
    recipe: [
      { ingredient: '진', measure: '1 2/3 oz' },
      { ingredient: '드라이 베르무트', measure: '1/3 oz' },
      { ingredient: 'Olive', measure: '1' },
    ],
    recipeText: 'Straight: Pour all ingredients into mixing glass with ice cubes. Stir well. Strain in chilled martini cocktail glass. Squeeze oil from lemon peel onto the drink, or garnish with olive.',
    story: '마티니는 "칵테일의 제왕"이라고 불려요. 19세기 말 미국에서 처음 만들어졌는데, 제임스 본드가 "쉐이크, 낫 스티어드"라고 말하면서 더 유명해졌죠. 진과 베르무트의 드라이한 조화가 정말 세련된 맛이에요.',
    vibe: '냉철하고 우아한 고독',
    popCulture: '007 제임스 본드 시리즈의 시그니처',
    image: 'https://www.thecocktaildb.com/images/media/drink/71t8581504353095.jpg',
    glass: 'Cocktail glass',
    category: 'Cocktail',
    alcoholic: 'Alcoholic',
    apiId: '11728',
  },
  {
    id: 'daiquiri',
    name: '다이키리',
    nameEn: 'Daiquiri',
    aliases: ['다이퀴리'],
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: false },
    aroma: ['시트러스', '과일'],
    base: '럼',
    ingredients: ['럼', '라임', '설탕'],
    recipe: [
      { ingredient: '럼', measure: '1 1/2 oz' },
      { ingredient: '라임', measure: 'Juice of 1/2' },
      { ingredient: '설탕', measure: '1 tsp' },
    ],
    recipeText: 'Pour all ingredients into shaker with ice cubes. Shake well. Strain in chilled cocktail glass.',
    story: '다이키리는 1898년 쿠바의 다이키리 광산에서 일하던 엔지니어들이 처음 만든 칵테일이에요. 럼, 라임, 설탕 이렇게 세 가지 재료만으로 이렇게 완벽한 맛을 낸다는 게 정말 놀랍죠. 단순해서 더 매력적인 칵테일이에요.',
    vibe: '단순하지만 완벽한 균형의 맛',
    image: 'https://www.thecocktaildb.com/images/media/drink/mrz9091589574515.jpg',
    glass: 'Cocktail glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '11006',
  },
  {
    id: 'whiskey-sour',
    name: '위스키 사워',
    nameEn: 'Whiskey Sour',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: false },
    aroma: ['시트러스', '스모키'],
    base: '리큐르',
    ingredients: ['Blended whiskey', '레몬', '설탕', '체리', '레몬'],
    recipe: [
      { ingredient: 'Blended whiskey', measure: '2 oz' },
      { ingredient: '레몬', measure: 'Juice of 1/2' },
      { ingredient: '설탕', measure: '1/2 tsp' },
      { ingredient: '체리', measure: '1' },
      { ingredient: '레몬', measure: '1/2 slice' },
    ],
    recipeText: 'Shake with ice. Strain into chilled glass, garnish and serve. If served \'On the rocks\', strain ingredients into old-fashioned glass filled with ice.',
    story: '위스키 사워는 19세기 미국에서 선원들이 괴혈병 예방을 위해 레몬 주스를 위스키에 섞어 마신 데서 유래했어요. 신맛과 단맛의 조화가 정말 유쾌하죠. 달걀 흰자를 넣으면 더 부드러운 거품 질감을 즐길 수 있답니다.',
    vibe: '신맛과 단맛의 유쾌한 조화',
    image: 'https://www.thecocktaildb.com/images/media/drink/hbkfsh1589574990.jpg',
    glass: 'Old-fashioned glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '11004',
  },
  {
    id: 'pina-colada',
    name: '피나 콜라다',
    nameEn: 'Pina Colada',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: false },
    aroma: ['과일', '코코넛', '크리미'],
    base: '럼',
    ingredients: ['럼', 'Coconut milk', 'Pineapple'],
    recipe: [
      { ingredient: '럼', measure: '3 oz' },
      { ingredient: 'Coconut milk', measure: '3 tblsp' },
      { ingredient: 'Pineapple', measure: '3 tblsp' },
    ],
    recipeText: 'Mix with crushed ice in blender until smooth. Pour into chilled glass, garnish and serve.',
    story: '피나 콜라다는 1954년 푸에르토리코에서 탄생했어요. 사실 푸에르토리코의 공식 칵테일이랍니다. 파인애플과 코코넛의 달콤함이 입안 가득 퍼지면서 마치 열대 휴양지에 온 듯한 기분을 느끼게 해줘요.',
    vibe: '열대 휴양지의 달콤한 꿈',
    image: 'https://www.thecocktaildb.com/images/media/drink/upgsue1668419912.jpg',
    glass: 'Collins glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '17207',
  },
  {
    id: 'espresso-martini',
    name: '에스프레소 마티니',
    nameEn: 'Espresso Martini',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 4, carbonated: false },
    aroma: ['커피', '스파이시'],
    base: '보드카',
    ingredients: ['보드카', '깔루아', 'Sugar syrup'],
    recipe: [
      { ingredient: '보드카', measure: '5 cl' },
      { ingredient: '깔루아', measure: '1 cl' },
      { ingredient: 'Sugar syrup', measure: '1 dash' },
    ],
    recipeText: 'Pour ingredients into shaker filled with ice, shake vigorously, and strain into chilled martini glass',
    story: '에스프레소 마티니는 런던에서 한 슈퍼모델이 "날 깨우면서 취하게 해줘"라고 주문한 데서 시작됐어요. 카페인과 알코올의 위험하면서도 매혹적인 만남, 한 잔 하면 왜 인기인지 바로 알게 될 거예요.',
    vibe: '카페인과 알코올의 위험하고 매혹적인 만남',
    image: 'https://www.thecocktaildb.com/images/media/drink/n0sx531504372951.jpg',
    glass: 'Cocktail glass',
    category: 'Cocktail',
    alcoholic: 'Alcoholic',
    apiId: '17212',
  },
  {
    id: 'mint-julep',
    name: '민트 줄렙',
    nameEn: 'Mint Julep',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: false },
    aroma: ['허브', '민트', '스모키'],
    base: '리큐르',
    ingredients: ['민트', '버번', '설탕', '물'],
    recipe: [
      { ingredient: '민트', measure: '4 fresh' },
      { ingredient: '버번', measure: '2 1/2 oz' },
      { ingredient: '설탕', measure: '1 tsp' },
      { ingredient: '물', measure: '2 tsp' },
    ],
    recipeText: 'In a highball glass gently muddle the mint, sugar and water. Fill the glass with cracked ice, add Bourbon and stir well until the glass is well frosted. Garnish with a mint sprig.',
    story: '민트 줄렙은 켄터키 더비의 공식 칵테일이에요. 19세기 미국 남부 상류층 사이에서 유행했죠. 버번 위스키에 신선한 민트 향이 더해져서 정말 우아한 느낌을 주는 칵테일이에요. 경기장에서 이걸 들고 있는 모습, 상상되시나요?',
    vibe: '남부 귀족의 우아한 오후',
    image: 'https://www.thecocktaildb.com/images/media/drink/squyyq1439907312.jpg',
    glass: 'Collins glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '17206',
  },
  {
    id: 'bloody-mary',
    name: '블러디 메리',
    nameEn: 'Bloody Mary',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: false },
    aroma: ['스파이시', '허브', '세이보리'],
    base: '보드카',
    ingredients: ['보드카', '토마토 주스', '레몬 주스', '우스터 소스', 'Tabasco sauce', '라임'],
    recipe: [
      { ingredient: '보드카', measure: '1 1/2 oz' },
      { ingredient: '토마토 주스', measure: '3 oz' },
      { ingredient: '레몬 주스', measure: '1 dash' },
      { ingredient: '우스터 소스', measure: '1/2 tsp' },
      { ingredient: 'Tabasco sauce', measure: '2-3 drops' },
      { ingredient: '라임', measure: '1 wedge' },
    ],
    recipeText: 'Stirring gently, pour all ingredients into highball glass. Garnish.',
    story: '블러디 메리는 1920년대 파리에서 바텐더 페르낭 프티오가 만든 칵테일이에요. 이름은 영국 여왕 메리 1세에서 따왔다고 해요. 토마토 주스 베이스에 스파이시한 향신료가 더해져 아침 해장용으로도 그만이랍니다.',
    vibe: '짭짤하고 스파이시한 아침 해장',
    image: 'https://www.thecocktaildb.com/images/media/drink/t6caa21582485702.jpg',
    glass: 'Old-fashioned glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '11113',
  },
  {
    id: 'sidecar',
    name: '사이드카',
    nameEn: 'Sidecar',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: false },
    aroma: ['시트러스', '과일'],
    base: '브랜디',
    ingredients: ['코냑', '쿠앵트로', '레몬 주스'],
    recipe: [
      { ingredient: '코냑', measure: '2 oz' },
      { ingredient: '쿠앵트로', measure: '1/2 oz' },
      { ingredient: '레몬 주스', measure: '1 oz' },
    ],
    recipeText: 'Pour all ingredients into cocktail shaker filled with ice. Shake well and strain into cocktail glass.',
    story: '사이드카는 1차대전 후 파리 릿츠 호텔에서 탄생했어요. 사이드카를 타고 온 장교를 위해 만들어졌다는 설이 있답니다. 코냑의 깊은 맛에 레몬의 상큼함이 더해져, 전쟁의 상처를 잊게 하는 달콤한 도피 같은 칵테일이에요.',
    vibe: '전쟁의 상처를 잊게 하는 달콤한 도피',
    image: 'https://www.thecocktaildb.com/images/media/drink/x72sik1606854964.jpg',
    glass: 'Cocktail glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '12196',
  },
  {
    id: 'manhattan',
    name: '맨해튼',
    nameEn: 'Manhattan',
    aliases: ['맨하탄'],
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 4, carbonated: false },
    aroma: ['스모키', '허브', '체리'],
    base: '리큐르',
    ingredients: ['스위트 베르무트', '버번', '앙고스투라 비터', '얼음', '체리', 'Orange peel'],
    recipe: [
      { ingredient: '스위트 베르무트', measure: '3/4 oz' },
      { ingredient: '버번', measure: '2 1/2 oz Blended' },
      { ingredient: '앙고스투라 비터', measure: 'dash' },
      { ingredient: '얼음', measure: '2 or 3' },
      { ingredient: '체리', measure: '1' },
      { ingredient: 'Orange peel', measure: '1 twist of' },
    ],
    recipeText: 'Stirred over ice, strained into a chilled glass, garnished, and served up.',
    story: '맨해튼은 1870년대 뉴욕 맨해튼 클럽에서 윈스턴 처칠의 어머니를 위해 만들어졌다고 해요. 라이 위스키의 스파이시함과 베르무트의 달콤함이 만나 황금기 뉴욕의 우아함을 느끼게 해주는 칵테일이에요.',
    vibe: '황금기의 뉴욕, 비즈니스와 우아함',
    image: 'https://www.thecocktaildb.com/images/media/drink/yk70e31606771240.jpg',
    glass: 'Cocktail glass',
    category: 'Cocktail',
    alcoholic: 'Alcoholic',
    apiId: '11008',
  },
  {
    id: 'caipirinha',
    name: '카이피리냐',
    nameEn: 'Caipirinha',
    aliases: ['카이피린야'],
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: false },
    aroma: ['시트러스', '과일'],
    base: '리큐르',
    ingredients: ['설탕', '라임', '카샤사'],
    recipe: [
      { ingredient: '설탕', measure: '2 tsp' },
      { ingredient: '라임', measure: '1' },
      { ingredient: '카샤사', measure: '2 1/2 oz' },
    ],
    recipeText: 'Place lime and sugar into old fashioned glass and muddle (mash the two ingredients together using a muddler or a wooden spoon). Fill the glass with ice and add the Cachaça.',
    story: '카이피리냐는 브라질의 국민 칵테일이에요. 1918년 스페인 독감 이후 건강에 좋다며 약으로 먹기 시작했다는 재미있는 유래가 있죠. 카샤사와 라임, 설탕만으로 이렇게 상쾌한 맛을 낸다는 게 정말 놀라워요.',
    vibe: '열정적인 삼바의 나라, 브라질의 맛',
    image: 'https://www.thecocktaildb.com/images/media/drink/jgvn7p1582484435.jpg',
    glass: 'Old-fashioned glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '11202',
  },
  {
    id: 'sazerac',
    name: '사제락',
    nameEn: 'Sazerac',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 4, carbonated: false },
    aroma: ['스모키', '허브', '스파이시', '리코리시'],
    base: '리큐르',
    ingredients: ['Ricard', '설탕', '페요 비터', '물', '버번', 'Lemon peel'],
    recipe: [
      { ingredient: 'Ricard', measure: '1 tsp' },
      { ingredient: '설탕', measure: '1/2 tsp superfine' },
      { ingredient: '페요 비터', measure: '2 dashes' },
      { ingredient: '물', measure: '1 tsp' },
      { ingredient: '버번', measure: '2 oz' },
      { ingredient: 'Lemon peel', measure: '1 twist of' },
    ],
    recipeText: 'Rinse a chilled old-fashioned glass with the absinthe, add crushed ice, and set it aside. Stir the remaining ingredients over ice and set it aside. Discard the ice and any excess absinthe from the prepared glass, and strain the drink into the glass. Add the lemon peel for garnish.',
    story: '사제락은 1838년 뉴올리언스에서 탄생한 미국 최초의 칵테일이에요. 압생트로 잔을 헹궈서 향만 남기는 독특한 방식이 인상적이죠. 미스터리하고 신비로운 뉴올리언스의 밤을 떠올리게 하는 칵테일이에요.',
    vibe: '미스터리하고 신비로운 뉴올리언스의 밤',
    image: 'https://www.thecocktaildb.com/images/media/drink/vvpxwy1439907208.jpg',
    glass: 'Old-fashioned glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '12127',
  },
  {
    id: 'singapore-sling',
    name: '싱가포르 슬링',
    nameEn: 'Singapore Sling',
    aliases: ['싱가폴 슬링', '싱가폴슬링'],
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: true },
    aroma: ['과일', '시트러스', '플로럴'],
    base: '브랜디',
    ingredients: ['체리 브랜디', '그레나딘', '진', 'Sweet and sour', 'Carbonated water', '체리'],
    recipe: [
      { ingredient: '체리 브랜디', measure: '1/2 oz' },
      { ingredient: '그레나딘', measure: '1/2 oz' },
      { ingredient: '진', measure: '1 oz' },
      { ingredient: 'Sweet and sour', measure: '2 oz' },
      { ingredient: 'Carbonated water', measure: '' },
      { ingredient: '체리', measure: '' },
    ],
    recipeText: 'Pour all ingredients into cocktail shaker filled with ice cubes. Shake well. Strain into highball glass. Garnish with pineapple and cocktail cherry.',
    story: '싱가포르 슬링은 1915년 싱가포르 래플스 호텔에서 바텐더가 여성 손님을 위해 만든 칵테일이에요. 과일 향이 풍부하고 색도 예뻐서 당시에 큰 인기를 끌었다고 해요. 동양과 서양이 만나는 이국적인 항구의 분위기를 느낄 수 있어요.',
    vibe: '동양과 서양이 만나는 이국적인 항구',
    image: 'https://www.thecocktaildb.com/images/media/drink/7dozeg1582578095.jpg',
    glass: 'Hurricane glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '12214',
  },
  {
    id: 'tom-collins',
    name: '톰 콜린스',
    nameEn: 'Tom Collins',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: true },
    aroma: ['시트러스', '허브'],
    base: '진',
    ingredients: ['진', '레몬 주스', '설탕', '소다수', '체리', 'Orange'],
    recipe: [
      { ingredient: '진', measure: '2 oz' },
      { ingredient: '레몬 주스', measure: '1 oz' },
      { ingredient: '설탕', measure: '1 tsp superfine' },
      { ingredient: '소다수', measure: '3 oz' },
      { ingredient: '체리', measure: '1' },
      { ingredient: 'Orange', measure: '1' },
    ],
    recipeText: 'In a shaker half-filled with ice cubes, combine the gin, lemon juice, and sugar. Shake well. Strain into a collins glass alomst filled with ice cubes. Add the club soda. Stir and garnish with the cherry and the orange slice.',
    story: '톰 콜린스는 19세기 런던에서 유행한 칵테일이에요. 진의 드라이한 맛에 레몬의 상큼함, 소다의 청량감이 더해져 부담 없이 즐기기 좋은 한 잔이죠. 영국 정원의 오후, 차 대신 한 잔 하면 딱이에요.',
    vibe: '영국 정원의 오후, 차 대신 한 잔',
    image: 'https://www.thecocktaildb.com/images/media/drink/7cll921606854636.jpg',
    glass: 'Collins glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '12402',
  },
  {
    id: 'bellini',
    name: '벨리니',
    nameEn: 'Bellini',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: true },
    aroma: ['과일', '플로럴', '복숭아'],
    base: '리큐르',
    ingredients: ['샴페인', '복숭아 슈냅스'],
    recipe: [
      { ingredient: '샴페인', measure: '6 oz' },
      { ingredient: '복숭아 슈냅스', measure: '1 oz' },
    ],
    recipeText: 'Pour peach purée into chilled flute, add sparkling wine. Stir gently.',
    story: '벨리니는 1948년 베니스 해리즈 바에서 탄생했어요. 화가 조반니 벨리니의 그림에서 영감을 받았다고 해요. 프로세코와 복숭아 퓌레의 만남, 베니스의 석양을 닮은 이 아름다운 색감 좀 보세요. 정말 예술 작품 같지 않나요?',
    vibe: '베니스의 석양, 예술과 로맨스',
    image: 'https://www.thecocktaildb.com/images/media/drink/eaag491504367543.jpg',
    glass: 'Champagne Flute',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '17195',
  },
  {
    id: 'moscow-mule',
    name: '모스크바 뮬',
    nameEn: 'Moscow Mule',
    aliases: ['모스코 뮬', '모스코뮬'],
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: true },
    aroma: ['시트러스', '진저'],
    base: '보드카',
    ingredients: ['보드카', '라임 주스', '진저 에일'],
    recipe: [
      { ingredient: '보드카', measure: '2 oz' },
      { ingredient: '라임 주스', measure: '2 oz' },
      { ingredient: '진저 에일', measure: '8 oz' },
    ],
    recipeText: 'Combine vodka and ginger beer in a highball glass filled with ice. Add lime juice. Stir gently. Garnish.',
    story: '모스크바 뮬은 1940년대 미국에서 보드카 판매를 늘리기 위해 만들어진 칵테일이에요. 이름은 모스크바지만 실제로는 미국에서 태어났다는 재미있는 사실이 있죠. 진저 비어의 톡 쏘는 맛이 정말 중독성이 있어요.',
    vibe: '차갑고 청량한, 텁텁함을 날리는 한 방',
    image: 'https://www.thecocktaildb.com/images/media/drink/3pylqc1504370988.jpg',
    glass: 'Copper Mug',
    category: 'Punch / Party Drink',
    alcoholic: 'Alcoholic',
    apiId: '11009',
  },
  {
    id: 'mai-tai',
    name: '마이타이',
    nameEn: 'Mai Tai',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: false },
    aroma: ['과일', '코코넛', '시트러스'],
    base: '럼',
    ingredients: ['럼', '오르젯 시럽', '트리플 섹', 'Sweet and sour', '체리'],
    recipe: [
      { ingredient: '럼', measure: '1 oz' },
      { ingredient: '오르젯 시럽', measure: '1/2 oz' },
      { ingredient: '트리플 섹', measure: '1/2 oz' },
      { ingredient: 'Sweet and sour', measure: '1 1/2 oz' },
      { ingredient: '체리', measure: '1' },
    ],
    recipeText: 'Shake all ingredients with ice. Strain into glass. Garnish and serve with straw.',
    story: '마이타이는 1944년 캘리포니아에서 빅 버저온이 만든 티키 칵테일의 전설이에요. 남태평양의 낙원을 떠올리게 하는 이 한 잔, 모든 걱정을 잊게 해줄 거예요. 럼의 깊은 맛과 과일의 달콤함이 정말 잘 어울려요.',
    vibe: '남태평양의 낙원, 모든 걱정을 잊게 하는 맛',
    image: 'https://www.thecocktaildb.com/images/media/drink/twyrrp1439907470.jpg',
    glass: 'Collins glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '11690',
  },
  {
    id: 'aperol-spritz',
    name: '아페롤 스프리츠',
    nameEn: 'Aperol Spritz',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: true },
    aroma: ['시트러스', '허브', '비터'],
    base: '리큐르',
    ingredients: ['아페롤', '프로세코', '소다수'],
    recipe: [
      { ingredient: '아페롤', measure: '100 ml' },
      { ingredient: '프로세코', measure: '150 ml' },
      { ingredient: '소다수', measure: 'Top' },
    ],
    recipeText: 'Put a couple of cubes of ice into 2 glasses and add a 50 ml measure of Aperol to each. Divide the prosecco between the glasses and then top up with soda, if you like.',
    story: '아페롤 스프리츠는 1950년대 이탈리아 베네토 지방에서 탄생한 대표적인 아페리티프예요. 쌉싸름하면서도 상큼한 맛이 식욕을 돋우는 데 그만이죠. 이탈리아 해변의 여유로운 오후를 상상하게 하는 칵테일이에요.',
    vibe: '이탈리아 해변의 여유로운 오후',
    image: 'https://www.thecocktaildb.com/images/media/drink/iloasq1587661955.jpg',
    glass: 'Wine Glass',
    category: 'Cocktail',
    alcoholic: 'Alcoholic',
    apiId: '178325',
  },
  {
    id: 'pisco-sour',
    name: '피스코 사워',
    nameEn: 'Pisco Sour',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: false },
    aroma: ['시트러스', '플로럴', '허브'],
    base: '브랜디',
    ingredients: ['피스코', '레몬 주스', '설탕', '얼음', '달걀 흰자'],
    recipe: [
      { ingredient: '피스코', measure: '2 oz' },
      { ingredient: '레몬 주스', measure: '1 oz' },
      { ingredient: '설탕', measure: '1-2 tblsp' },
      { ingredient: '얼음', measure: '1' },
      { ingredient: '달걀 흰자', measure: '' },
    ],
    recipeText: 'Vigorously shake and strain contents in a cocktail shaker with ice cubes, then pour into glass and garnish with bitters.',
    story: '피스코 사워는 1920년대 페루 리마에서 미국인 바텐더 빅터 모리스가 만든 칵테일이에요. 피스코의 향긋함과 라임의 상큼함이 어우러지고, 부드러운 거품이 입안을 감싸는 느낌이 정말 고급스러워요.',
    vibe: '안데스 산맥이 선사하는 신선한 바람',
    image: 'https://www.thecocktaildb.com/images/media/drink/tsssur1439907622.jpg',
    glass: 'Cocktail glass',
    category: 'Cocktail',
    alcoholic: 'Alcoholic',
    apiId: '13214',
  },
  {
    id: 'painkiller',
    name: '페인킬러',
    nameEn: 'Painkiller',
    taste: { sweet: 4, sour: 2, bitter: 1, savory: 1, alcohol: 2, carbonated: false },
    aroma: ['과일', '코코넛', '시트러스'],
    base: '럼',
    ingredients: ['럼', '파인애플 주스', '오렌지 주스', '코코넛 크림', '육두구'],
    recipe: [
      { ingredient: '럼', measure: '60 ml' },
      { ingredient: '파인애플 주스', measure: '120 ml' },
      { ingredient: '오렌지 주스', measure: '30 ml' },
      { ingredient: '코코넛 크림', measure: '30 ml' },
      { ingredient: '육두구', measure: 'garnish' },
    ],
    recipeText: 'Add rum, pineapple juice, orange juice, and coconut cream to a shaker with ice. Shake well and strain into a glass. Grate fresh nutmeg on top.',
    story: '페인킬러라는 이름처럼 "모든 고통을 잠재우는 칵테일"이라는 뜻이에요. 1970년대 버진 아일랜드에서 탄생했죠. 파인애플과 코코넛의 달콤함이 입안 가득 퍼지면서 스트레스까지 녹여주는 기분이에요.',
    vibe: '열대 섬의 달콤한 도피',
    glass: 'Highball glass',
    category: 'Cocktail',
    alcoholic: 'Alcoholic',
  },
  {
    id: 'clover-club',
    name: '클로버 클럽',
    nameEn: 'Clover Club',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: false },
    aroma: ['과일', '베리', '플로럴'],
    base: '진',
    ingredients: ['진', '그레나딘', '레몬', '달걀 흰자'],
    recipe: [
      { ingredient: '진', measure: '1 1/2 oz' },
      { ingredient: '그레나딘', measure: '2 tsp' },
      { ingredient: '레몬', measure: 'Juice of 1/2' },
      { ingredient: '달걀 흰자', measure: '1' },
    ],
    recipeText: 'Dry shake ingredients to emulsify, add ice, shake and served straight up.',
    story: '클로버 클럽은 20세기 초 뉴욕의 사교 클럽에서 탄생했어요. 금주법 시대에 은밀히 사랑받았죠. 진의 드라이함과 라즈베리의 달콤함이 만나 정말 우아한 핑크빛을 띠고 있어요. 마시면 비밀스러운 클럽에 들어온 기분이 들어요.',
    vibe: '비밀스러운 클럽의 우아한 핑크빛',
    image: 'https://www.thecocktaildb.com/images/media/drink/t0aja61504348715.jpg',
    glass: 'Cocktail glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '17186',
  },
  {
    id: 'bramble',
    name: '브램블',
    nameEn: 'Bramble',
    taste: { sweet: 2, sour: 1, bitter: 1, savory: 1, alcohol: 3, carbonated: false },
    aroma: ['과일', '베리', '시트러스'],
    base: '진',
    ingredients: ['진', '레몬 주스', 'Sugar syrup', '크렘 드 뮤르'],
    recipe: [
      { ingredient: '진', measure: '4 cl' },
      { ingredient: '레몬 주스', measure: '1.5 cl' },
      { ingredient: 'Sugar syrup', measure: '1 cl' },
      { ingredient: '크렘 드 뮤르', measure: '1.5 cl' },
    ],
    recipeText: 'Fill glass with crushed ice. Build gin, lemon juice and simple syrup over. Stir, and then pour blackberry liqueur over in a circular fashion to create marbling effect. Garnish with two blackberries and lemon slice.',
    story: '브램블은 1984년 런던의 전설적인 바텐더 딕 브래드셀이 만든 모던 클래식이에요. 크렘 드 뮤르의 진한 베리 향이 정말 매력적이죠. 잔을 기울이면 생기는 그라데이션이 마치 예술 작품 같아요.',
    vibe: '영국 시골길의 가시덤불, 야생의 달콤함',
    image: 'https://www.thecocktaildb.com/images/media/drink/twtbh51630406392.jpg',
    glass: 'Old-Fashioned glass',
    category: 'Ordinary Drink',
    alcoholic: 'Alcoholic',
    apiId: '17210',
  },
]

function normalizeForSearch(s: string): string {
  return s.toLowerCase().replace(/[\s\-_']+/g, '')
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) d[i][0] = i
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      d[i][j] = a[i - 1] === b[j - 1]
        ? d[i - 1][j - 1]
        : Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + 1)
    }
  }
  return d[m][n]
}

function isFuzzyMatch(query: string, target: string): boolean {
  if (query.length < 2 || target.length < 2) return false
  const threshold = Math.max(1, Math.floor(Math.min(query.length, target.length) * 0.3))
  return levenshteinDistance(query, target) <= threshold
}

function parseRecipeIngredients(recipe: string): string[] {
  return recipe
    .split(',')
    .map((part) => part.trim())
    .map((part) => part
      .replace(/\s+바 스푼 \d+개$/, '')
      .replace(/\s+\d+(?:\.\d+)?(?:~\d+(?:\.\d+)?)?\s*(?:ml|oz|대시|티스푼|개|조각)$/i, '')
      .replace(/\s+(?:한 꼬집|약간(?: \(선택\))?)$/, '')
      .trim())
    .filter((ingredient) => ingredient && !ingredient.startsWith('배합 비공개'))
}

function createCocktailData(record: CocktailRecord): CocktailData {
  const scale = (n: number) => Math.max(1, Math.min(5, Math.round(n * 5)))
  const legacyMatch = legacyCocktails.find(
    (c) =>
      c.name === record.name ||
      (c.nameEn && record.name_en && c.nameEn === record.name_en) ||
      c.name === record.name_ko,
  )
  const ingredients = parseRecipeIngredients(record.recipe)

  return {
    id: record.id,
    name: record.name_ko ?? record.name,
    nameEn: record.name_en ?? record.name,
    aliases: legacyMatch?.aliases,
    type: record.type,
    features: record.features,
    name_en: record.name_en,
    name_ko: record.name_ko,
    base_spirit: record.base_spirit,
    recipe_source_url: record.recipe_source_url,
    official_category: record.official_category,
    bar_id: isSignatureCocktail(record) ? record.bar_id : undefined,
    bar_name: isSignatureCocktail(record) ? record.bar_name : undefined,
    bar_location_link: isSignatureCocktail(record) ? record.bar_location_link : undefined,
    taste: {
      sweet: scale(record.features.sweetness),
      sour: scale(record.features.sourness),
      bitter: scale(1 - record.features.sweetness * 0.7),
      savory: legacyMatch?.taste.savory ?? 2,
      alcohol: scale(record.features.alcohol_strength),
      carbonated: record.features.fizz >= 0.35,
    },
    aroma: legacyMatch?.aroma ?? [],
    base: record.base_spirit ?? (isSignatureCocktail(record) ? record.bar_name : 'Classic'),
    ingredients,
    recipeText: record.recipe,
    story: record.description,
    vibe: legacyMatch?.vibe ?? (
      isSignatureCocktail(record)
        ? `Signature @ ${record.bar_name}`
        : 'Classic cocktail'
    ),
    description: record.description,
    popCulture: legacyMatch?.popCulture ?? (
      isSignatureCocktail(record) ? record.bar_location_link : undefined
    ),
    image: record.image ?? legacyMatch?.image,
    glass: legacyMatch?.glass,
    category: record.type,
    alcoholic: legacyMatch?.alcoholic,
  }
}

export const cocktails: CocktailData[] = cocktailDatabase.cocktails.map(createCocktailData)

export function findCocktailByKeyword(keyword: string): CocktailData | null {
  const lower = keyword.toLowerCase()
  const norm = normalizeForSearch(keyword)
  for (const c of cocktails) {
    if (c.name.toLowerCase().includes(lower)) return c
    if (c.nameEn?.toLowerCase().includes(lower)) return c
    if (c.ingredients.some(i => i.toLowerCase().includes(lower))) return c
    if (c.aroma.some(a => lower.includes(a))) return c
    if (c.aliases?.some(a => normalizeForSearch(a).includes(norm) || norm.includes(normalizeForSearch(a)))) return c

    const nameNorm = normalizeForSearch(c.name)
    const nameEnNorm = c.nameEn ? normalizeForSearch(c.nameEn) : undefined

    if (nameNorm.includes(norm)) return c
    if (nameEnNorm?.includes(norm)) return c
    if (norm.includes(nameNorm)) return c
    if (nameEnNorm && norm.includes(nameEnNorm)) return c
    if (c.ingredients.some(i => normalizeForSearch(i).includes(norm))) return c
    if (c.aroma.some(a => norm.includes(normalizeForSearch(a)))) return c

    if (isFuzzyMatch(norm, nameNorm)) return c
    if (nameEnNorm && isFuzzyMatch(norm, nameEnNorm)) return c
  }
  return null
}

export function findCocktailByName(query: string): CocktailData | null {
  const norm = normalizeForSearch(query)
  if (norm.length < 2) return null

  return cocktails.find((c) => {
    const names = [c.name, c.nameEn, c.name_en, c.name_ko, ...(c.aliases ?? [])]
      .filter((name): name is string => Boolean(name))
      .map(normalizeForSearch)
    return names.some((name) => norm === name || norm.includes(name))
  }) ?? null
}

export function searchCocktail(query: string): CocktailData | null {
  return findCocktailByKeyword(query)
}

export function getRandomCocktail(): CocktailData {
  return cocktails[Math.floor(Math.random() * cocktails.length)]
}

export function getPartnerBars(activeOnly = true): PartnerBar[] {
  return activeOnly
    ? cocktailDatabase.partner_bars.filter((b) => b.active)
    : cocktailDatabase.partner_bars
}

export function getPartnerBarById(barId: string): PartnerBar | undefined {
  return cocktailDatabase.partner_bars.find((b) => b.id === barId)
}

export function getAllCocktailData(): CocktailData[] {
  return cocktails
}

export function getClassicCocktails(): CocktailData[] {
  return cocktails.filter((c) => c.type === 'CLASSIC')
}

export function getSignatureCocktails(): CocktailData[] {
  return cocktails.filter((c) => c.type === 'SIGNATURE')
}

export function getCocktailById(id: string): CocktailData | undefined {
  return cocktails.find((c) => c.id === id)
}

export function getCocktailsForBar(barId: string): CocktailData[] {
  return cocktails.filter((c) => c.type === 'SIGNATURE' && c.bar_id === barId)
}

export function scoreCocktailMatch(
  record: CocktailData,
  preference: TastePreference,
  weights: Partial<Record<FeatureKey, number>> = {},
): number {
  const defaultWeight = 1
  let totalWeight = 0
  let weightedDistance = 0

  const keys: FeatureKey[] = ['sweetness', 'alcohol_strength', 'fizz', 'sourness']
  for (const key of keys) {
    const target = preference[key]
    if (target === undefined) continue
    const w = weights[key] ?? defaultWeight
    const delta = record.features[key] - target
    weightedDistance += w * delta * delta
    totalWeight += w
  }

  return totalWeight === 0 ? Infinity : weightedDistance / totalWeight
}

export function rankCocktailsByPreference(
  preference: TastePreference,
  options?: {
    weights?: Partial<Record<FeatureKey, number>>
    type?: 'CLASSIC' | 'SIGNATURE'
    limit?: number
  },
): CocktailData[] {
  let pool = [...cocktails]
  if (options?.type) pool = pool.filter((c) => c.type === options.type)

  const ranked = pool
    .map((record) => ({
      record,
      score: scoreCocktailMatch(record, preference, options?.weights),
    }))
    .sort((a, b) => a.score - b.score)

  const limit = options?.limit ?? ranked.length
  return ranked.slice(0, limit).map((r) => r.record)
}
