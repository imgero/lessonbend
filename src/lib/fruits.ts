export const fruitProfiles = [
  ["banana", "Banana", "🍌", "#e7b416"], ["strawberry", "Strawberry", "🍓", "#dc4b4b"], ["kiwi", "Kiwi", "🥝", "#4d9e52"], ["grape", "Grape", "🍇", "#7556b8"], ["orange", "Orange", "🍊", "#ed7b45"], ["watermelon", "Watermelon", "🍉", "#df5e65"], ["peach", "Peach", "🍑", "#ef996b"], ["cherry", "Cherry", "🍒", "#c83947"], ["lemon", "Lemon", "🍋", "#d7ae18"], ["avocado", "Avocado", "🥑", "#628e42"], ["coconut", "Coconut", "🥥", "#896d55"], ["melon", "Melon", "🍈", "#75ad48"], ["pear", "Pear", "🍐", "#98ad36"], ["apple", "Apple", "🍎", "#d8463d"], ["blueberries", "Blueberries", "🫐", "#5864bd"], ["tomato", "Tomato", "🍅", "#d94c3e"], ["mushroom", "Mushroom", "🍄", "#b66d59"], ["pepper", "Pepper", "🫑", "#438f59"], ["carrot", "Carrot", "🥕", "#e77933"], ["corn", "Corn", "🌽", "#d4aa22"],
] as const;

export const takenFruitIds = new Set(["short-concrete-loops", "audio-first", "math-language-support"]);
export const fruitById = new Map<string, { id: string; label: string; emoji: string; accent: string }>(fruitProfiles.map(([id, label, emoji, accent]) => [id, { id, label, emoji, accent }]));
