// Common provisioning items for a sailing trip, organized by category.
// Each item gets a stable string id so remote sync can match by id.

export const PROVISION_CATEGORIES = [
  'Breakfast',
  'Lunch & Snacks',
  'Dinner',
  'Fresh Produce',
  'Drinks',
  'Condiments & Pantry',
  'Canned & Dry Goods',
  'Dairy',
  'Paper & Cleaning',
  'Safety & Medical',
]

export const COMMON_PROVISIONS = [
  // Breakfast
  { id: 'prov-eggs',         name: 'Eggs',              category: 'Breakfast' },
  { id: 'prov-bread',        name: 'Bread',             category: 'Breakfast' },
  { id: 'prov-butter',       name: 'Butter',            category: 'Breakfast' },
  { id: 'prov-jam',          name: 'Jam / Jelly',       category: 'Breakfast' },
  { id: 'prov-oatmeal',      name: 'Oatmeal',           category: 'Breakfast' },
  { id: 'prov-coffee',       name: 'Coffee',            category: 'Breakfast' },
  { id: 'prov-tea',          name: 'Tea',               category: 'Breakfast' },
  { id: 'prov-oj',           name: 'Orange Juice',      category: 'Breakfast' },
  { id: 'prov-pancake',      name: 'Pancake Mix',       category: 'Breakfast' },
  { id: 'prov-syrup',        name: 'Maple Syrup',       category: 'Breakfast' },

  // Lunch & Snacks
  { id: 'prov-deli',         name: 'Deli Meat',         category: 'Lunch & Snacks' },
  { id: 'prov-cheese-sl',    name: 'Cheese (sliced)',   category: 'Lunch & Snacks' },
  { id: 'prov-crackers',     name: 'Crackers',          category: 'Lunch & Snacks' },
  { id: 'prov-pb',           name: 'Peanut Butter',     category: 'Lunch & Snacks' },
  { id: 'prov-chips',        name: 'Chips',             category: 'Lunch & Snacks' },
  { id: 'prov-granola',      name: 'Granola Bars',      category: 'Lunch & Snacks' },
  { id: 'prov-nuts',         name: 'Nuts',              category: 'Lunch & Snacks' },
  { id: 'prov-trail',        name: 'Trail Mix',         category: 'Lunch & Snacks' },
  { id: 'prov-jerky',        name: 'Beef Jerky',        category: 'Lunch & Snacks' },

  // Dinner
  { id: 'prov-pasta',        name: 'Pasta',             category: 'Dinner' },
  { id: 'prov-rice',         name: 'Rice',              category: 'Dinner' },
  { id: 'prov-tortillas',    name: 'Tortillas',         category: 'Dinner' },
  { id: 'prov-hotdogs',      name: 'Hot Dogs / Sausage',category: 'Dinner' },
  { id: 'prov-mac',          name: 'Mac & Cheese',      category: 'Dinner' },
  { id: 'prov-inst-noodle',  name: 'Instant Noodles',   category: 'Dinner' },
  { id: 'prov-burgers',      name: 'Burgers / Ground Beef', category: 'Dinner' },

  // Fresh Produce
  { id: 'prov-apples',       name: 'Apples',            category: 'Fresh Produce' },
  { id: 'prov-bananas',      name: 'Bananas',           category: 'Fresh Produce' },
  { id: 'prov-oranges',      name: 'Oranges',           category: 'Fresh Produce' },
  { id: 'prov-carrots',      name: 'Carrots',           category: 'Fresh Produce' },
  { id: 'prov-onions',       name: 'Onions',            category: 'Fresh Produce' },
  { id: 'prov-potatoes',     name: 'Potatoes',          category: 'Fresh Produce' },
  { id: 'prov-garlic',       name: 'Garlic',            category: 'Fresh Produce' },
  { id: 'prov-lettuce',      name: 'Lettuce / Salad',   category: 'Fresh Produce' },
  { id: 'prov-tomatoes',     name: 'Tomatoes',          category: 'Fresh Produce' },
  { id: 'prov-limes',        name: 'Limes / Lemons',    category: 'Fresh Produce' },

  // Drinks
  { id: 'prov-water',        name: 'Bottled Water',     category: 'Drinks' },
  { id: 'prov-beer',         name: 'Beer',              category: 'Drinks' },
  { id: 'prov-wine',         name: 'Wine',              category: 'Drinks' },
  { id: 'prov-soda',         name: 'Soda',              category: 'Drinks' },
  { id: 'prov-sports',       name: 'Sports Drinks',     category: 'Drinks' },
  { id: 'prov-ice',          name: 'Ice',               category: 'Drinks' },
  { id: 'prov-juice',        name: 'Juice Boxes',       category: 'Drinks' },

  // Condiments & Pantry
  { id: 'prov-salt',         name: 'Salt',              category: 'Condiments & Pantry' },
  { id: 'prov-pepper',       name: 'Pepper',            category: 'Condiments & Pantry' },
  { id: 'prov-olive-oil',    name: 'Olive Oil',         category: 'Condiments & Pantry' },
  { id: 'prov-ketchup',      name: 'Ketchup',           category: 'Condiments & Pantry' },
  { id: 'prov-mustard',      name: 'Mustard',           category: 'Condiments & Pantry' },
  { id: 'prov-mayo',         name: 'Mayonnaise',        category: 'Condiments & Pantry' },
  { id: 'prov-hotsauce',     name: 'Hot Sauce',         category: 'Condiments & Pantry' },
  { id: 'prov-soy',          name: 'Soy Sauce',         category: 'Condiments & Pantry' },
  { id: 'prov-sugar',        name: 'Sugar',             category: 'Condiments & Pantry' },
  { id: 'prov-spray',        name: 'Cooking Spray',     category: 'Condiments & Pantry' },

  // Canned & Dry Goods
  { id: 'prov-can-soup',     name: 'Canned Soup',       category: 'Canned & Dry Goods' },
  { id: 'prov-can-tomato',   name: 'Canned Tomatoes',   category: 'Canned & Dry Goods' },
  { id: 'prov-can-beans',    name: 'Canned Beans',      category: 'Canned & Dry Goods' },
  { id: 'prov-can-corn',     name: 'Canned Corn',       category: 'Canned & Dry Goods' },
  { id: 'prov-can-tuna',     name: 'Canned Tuna',       category: 'Canned & Dry Goods' },
  { id: 'prov-can-chicken',  name: 'Canned Chicken',    category: 'Canned & Dry Goods' },
  { id: 'prov-can-fruit',    name: 'Canned Fruit',      category: 'Canned & Dry Goods' },

  // Dairy
  { id: 'prov-milk',         name: 'Milk',              category: 'Dairy' },
  { id: 'prov-cheese-blk',   name: 'Cheese (block)',    category: 'Dairy' },
  { id: 'prov-yogurt',       name: 'Yogurt',            category: 'Dairy' },
  { id: 'prov-cream-cheese', name: 'Cream Cheese',      category: 'Dairy' },
  { id: 'prov-sour-cream',   name: 'Sour Cream',        category: 'Dairy' },

  // Paper & Cleaning
  { id: 'prov-paper-towel',  name: 'Paper Towels',      category: 'Paper & Cleaning' },
  { id: 'prov-trash-bags',   name: 'Trash Bags',        category: 'Paper & Cleaning' },
  { id: 'prov-dish-soap',    name: 'Dish Soap',         category: 'Paper & Cleaning' },
  { id: 'prov-sponge',       name: 'Dish Sponge',       category: 'Paper & Cleaning' },
  { id: 'prov-foil',         name: 'Aluminum Foil',     category: 'Paper & Cleaning' },
  { id: 'prov-ziplock',      name: 'Ziplock Bags',      category: 'Paper & Cleaning' },
  { id: 'prov-napkins',      name: 'Napkins',           category: 'Paper & Cleaning' },
  { id: 'prov-plastic-wrap', name: 'Plastic Wrap',      category: 'Paper & Cleaning' },

  // Safety & Medical
  { id: 'prov-sunscreen',    name: 'Sunscreen',         category: 'Safety & Medical' },
  { id: 'prov-bug-spray',    name: 'Bug Spray',         category: 'Safety & Medical' },
  { id: 'prov-seasick',      name: 'Seasickness Meds',  category: 'Safety & Medical' },
  { id: 'prov-ibuprofen',    name: 'Ibuprofen / Aspirin', category: 'Safety & Medical' },
  { id: 'prov-antacid',      name: 'Antacid (Tums)',    category: 'Safety & Medical' },
  { id: 'prov-sanitizer',    name: 'Hand Sanitizer',    category: 'Safety & Medical' },
  { id: 'prov-lip-balm',     name: 'Lip Balm',          category: 'Safety & Medical' },
]
