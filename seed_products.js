const fs = require('fs');
const path = require('path');
const { buildStore } = require('./build_store');

const basePath = 'C:/Users/assa/.gemini/antigravity/scratch/paris-store';

const initialProducts = [
  // =================== CLOTHES (8 products) ===================
  {
    id: 1,
    mall: 'clothes',
    category: 'clothes men',
    chip: 'ملابس رجالي',
    title: 'تيشيرت قطن مصري كلاسيك 100% مريح وعملي',
    price: 185,
    regularPrice: 220,
    discountBadge: 'خصم 15%',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 2,
    mall: 'clothes',
    category: 'clothes men',
    chip: 'ملابس رجالي',
    title: 'قميص كاجوال رجالي أكسفورد قطن فاخر',
    price: 340,
    regularPrice: 425,
    discountBadge: 'خصم 20%',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 3,
    mall: 'clothes',
    category: 'clothes men',
    chip: 'ملابس رجالي',
    title: 'بنطلون جينز رجالي كلاسيك مريح وعالي الجودة',
    price: 390,
    regularPrice: 460,
    discountBadge: 'خصم 15%',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 4,
    mall: 'clothes',
    category: 'clothes women',
    chip: 'ملابس حريمي',
    title: 'فستان كاجوال صيفي ناعم بتصميم أنيق وعصري',
    price: 420,
    regularPrice: 525,
    discountBadge: 'خصم 20%',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 5,
    mall: 'clothes',
    category: 'clothes women',
    chip: 'ملابس حريمي',
    title: 'كارديجان نسائي خريفي طويل ناعم ومريح',
    price: 460,
    regularPrice: 550,
    discountBadge: 'خصم 16%',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 6,
    mall: 'clothes',
    category: 'clothes women',
    chip: 'ملابس حريمي',
    title: 'بلوزة نسائية قطنية أنيقة للعمل والمناسبات',
    price: 295,
    regularPrice: 295,
    discountBadge: '',
    image: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&auto=format&fit=crop&q=80',
    sale: false,
    published: true
  },
  {
    id: 7,
    mall: 'clothes',
    category: 'clothes kids',
    chip: 'ملابس أطفال',
    title: 'طقم ملابس نوم وبيجاما أطفال قطن مريحة',
    price: 230,
    regularPrice: 280,
    discountBadge: 'خصم 18%',
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 8,
    mall: 'clothes',
    category: 'clothes kids',
    chip: 'ملابس أطفال',
    title: 'سويت شيرت أطفال شتوي مبطن قطن دافئ',
    price: 260,
    regularPrice: 350,
    discountBadge: 'خصم 25%',
    image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },

  // =================== HOME & LIVING (11 products) ===================
  {
    id: 9,
    mall: 'home',
    category: 'home kitchen',
    chip: 'أدوات المطبخ',
    title: 'طقم سكاكين مطبخ ستانلس ياباني 6 قطع مع حامل',
    price: 310,
    regularPrice: 390,
    discountBadge: 'خصم 21%',
    image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 10,
    mall: 'home',
    category: 'home kitchen',
    chip: 'أدوات المطبخ',
    title: 'طقم توابل دوار زجاجي 12 برطمان ستانلس',
    price: 220,
    regularPrice: 280,
    discountBadge: 'خصم 21%',
    image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 11,
    mall: 'home',
    category: 'home kitchen',
    chip: 'أدوات المطبخ',
    title: 'طقم برطمانات توابل زجاجية بغطاء محكم',
    price: 295,
    regularPrice: 375,
    discountBadge: 'خصم 21%',
    image: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 12,
    mall: 'home',
    category: 'home kitchen',
    chip: 'أدوات المطبخ',
    title: 'طقم مقالي جرانيت تيفال غير لاصق 3 قطع',
    price: 750,
    regularPrice: 750,
    discountBadge: '',
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80',
    sale: false,
    published: true
  },
  {
    id: 13,
    mall: 'home',
    category: 'home decor',
    chip: 'ديكور وتنظيم',
    title: 'طقم إطارات ولوحات جدارية مودرن للمنزل',
    price: 320,
    regularPrice: 385,
    discountBadge: 'خصم 17%',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 14,
    mall: 'home',
    category: 'home decor',
    chip: 'ديكور وتنظيم',
    title: 'أباجورة طاولة مودرن بإضاءة دافئة مريحة',
    price: 275,
    regularPrice: 325,
    discountBadge: 'خصم 15%',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 15,
    mall: 'home',
    category: 'home textiles',
    chip: 'مفروشات ومناشف',
    title: 'طقم مناشف حمام قطن 100% فائقة الامتصاص',
    price: 280,
    regularPrice: 345,
    discountBadge: 'خصم 19%',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 16,
    mall: 'home',
    category: 'home textiles',
    chip: 'مفروشات ومناشف',
    title: 'بطانية تريكو ناعمة متعددة الاستخدامات للكنب',
    price: 350,
    regularPrice: 465,
    discountBadge: 'خصم 25%',
    image: 'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 17,
    mall: 'home',
    category: 'home textiles',
    chip: 'مفروشات ومناشف',
    title: 'طقم مفروشات سرير قطن تركي عالي النعومة',
    price: 680,
    regularPrice: 680,
    discountBadge: '',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
    sale: false,
    published: true
  },
  {
    id: 18,
    mall: 'home',
    category: 'home org',
    chip: 'منظمات المنزل',
    title: 'منظم أدراج وتقسيمات تخزين متعدد الاستخدام',
    price: 140,
    regularPrice: 175,
    discountBadge: 'خصم 20%',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  },
  {
    id: 19,
    mall: 'home',
    category: 'home org',
    chip: 'منظمات المنزل',
    title: 'صندوق تنظيم ملابس قماشي قابل للطي بغطاء',
    price: 195,
    regularPrice: 230,
    discountBadge: 'خصم 15%',
    image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&auto=format&fit=crop&q=80',
    sale: true,
    published: true
  }
];

fs.writeFileSync(path.join(basePath, 'products.json'), JSON.stringify(initialProducts, null, 2), 'utf8');

const adminConfig = {
  adminEmail: "admin@paris-store.com",
  adminName: "مدير متجر باريس",
  adminPassword: "admin",
  lastUpdated: new Date().toISOString()
};
fs.writeFileSync(path.join(basePath, 'admin_config.json'), JSON.stringify(adminConfig, null, 2), 'utf8');

buildStore();
console.log('Seeded 19 products with high-res images and built store successfully');
