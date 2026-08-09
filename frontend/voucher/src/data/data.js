// رسوم ثابتة تتحسب تلقائي في الحاسبة
export const DELIVERY_FEE = 25; // رسوم شحن الدليفري
export const CARD_SHIPPING_FEE = 10; // رسوم شحن كارت الخصم
export const CART_SCRIPT_URL = "PASTE_YOUR_CART_APPS_SCRIPT_URL_HERE";
export const WHATSAPP_NUMBER = "201025311724";

// كروت الخصم اللي العميل يقدر يطلبها من الهوم مباشرة
// عشان تضيف كارت جديد: زود عنصر هنا بنفس الشكل، وحط صور الكارت في مجلد public
// ⚠️ عدّل price بالسعر الحقيقي بتاع الكارت

export const cards = [
    {
        id: "ve-card-basic",
        name: "VE Card - Basic",
        description: "خصومات في مجموعة مختارة من المحلات والمطاعم (اكتب هنا أسماء الأماكن)",
        price: 10,
        images: ["logo.jpeg"],
    },
    {
        id: "ve-card-plus",
        name: "VE Card - Plus",
        description: "خصومات أوسع تغطي أماكن أكتر (اكتب هنا أسماء الأماكن)",
        price: 15,
        images: ["logo.jpeg"],
    },
    {
        id: "ve-card-premium",
        name: "VE Card - Premium",
        description: "أعلى نسب خصم وتغطية كاملة لكل الأماكن الشريكة (اكتب هنا أسماء الأماكن)",
        price: 20,
        images: ["logo.jpeg"],
    },
]
export const categories = [
    { id: 1, name: "clothes" },
    { id: 2, name: "courses" },
    { id: 3, name: "makeup and accessories" },
    { id: 4, name: "optics and glasses" },
    { id: 5, name: "gym" },
    { id: 6, name: "perfumes" },
    { id: 7, name: "restaurants & café" },
    { id: 8, name: "shoes" },
    { id: 9, name: "coffee & Beverages" },
    { id: 10, name: "Sportswear and sports equipment" },
]

export const shops = [
    {
        id: "1",
        name: "View Optics",
        description: "Stylish and high-quality sun and optical glasses designed for comfort, protection, and clear vision.",
        category_id: 4,
        percentage: "25%",
        status: "Active",
        addresses: ["شارع توت عنخ امون مع الحلو", "شارع حسن رضوان مع سعيد امام بون بون"],
        logos: ["view_optics.jpeg"],
        images: []
    },
    {
        id: "2",
        name: "Real Soft House",
        description: "Empowering learners with expert-led courses and practical skills for personal and professional growth.",
        category_id: 2,
        percentage: "15-20%",
        status: "Active",
        addresses: ["البحر مع طه الحكيم برج الزهانه الدور الثالث"],
        logos: ["real_soft_house.jpg"],
        images: []
    },
    {
        id: "3",
        name: "Tiny Kids",
        description: "Comfortable, stylish, and high-quality clothing designed to keep children looking great and feeling confident every day.",
        category_id: 1,
        percentage: "off%",
        status: "off",
        addresses: ["بطرس مع سعيد بجوار صيدلية هشام وفؤاد"],
        logos: ["tiny_kids.jpeg"],
        images: []
    },
    {
        id: "4",
        name: "Tarek Helmy",
        description: "Premium beauty and skincare products designed to enhance your natural glow and confidence.",
        category_id: 3,
        percentage: "off",
        status: "off",
        addresses: ["علي مبارك مع ابن الفارض امام نور الدين"],
        logos: ["tarek_helmy.jpeg"],
        images: []
    },
    {
        id: "5",
        name: "Vatrina",
        description: "Trendy and comfortable footwear for every style, occasion, and step of your journey.",
        category_id: 8,
        percentage: "20%",
        status: "Active",
        addresses: ["دوران النادي ناصية محل الزهيري"],
        logos: ["vatrina.png"],
        images: []
    },
    {
        id: "6",
        name: "Shailene",
        description: "Elegant and fashionable clothing designed to suit every woman's style, comfort, and confidence.",
        category_id: 1,
        percentage: "20%",
        status: "Active",
        addresses: ["ش علي مبارك امام كنيسة مارجرجس"],
        logos: ["shailene.jpeg"],
        images: []
    },
    {
        id: "7",
        name: "VIP Store",
        description: "Modern and versatile clothing crafted for style, comfort, and confidence in every occasion.",
        category_id: 1,
        percentage: "15%",
        status: "Active",
        addresses: ["حسان بن ثابت مع ممتاز غرابة امام بيكا"],
        logos: ["vip.jpeg"],
        images: []
    },
    {
        id: "8",
        name: "No.1",
        description: "Timeless footwear combining elegance, comfort, and craftsmanship for a refined look.",
        category_id: 8,
        percentage: "20%",
        status: "Active",
        addresses: ["النحاس مع هارون الرشيد امام التأمين الصحي الجديد"],
        logos: ["No.1_classic_shoe.jpeg"],
        images: []
    },
    {
        id: "9",
        name: "El-Haram - الهرم",
        description: "Luxurious and long-lasting fragrances that express your personality and leave a memorable impression.",
        category_id: 6,
        percentage: "15-20%",
        status: "Active",
        addresses: ["المديرية مع درب الابشيهي"],
        logos: ["el-haram.jpeg"],
        images: []
    },
    {
        id: "10",
        name: "Juice Box",
        description: "Refreshing beverages and tasty drinks crafted to energize your day and satisfy every taste.",
        category_id: 9,
        percentage: "20%",
        status: "Active",
        addresses: ["شارع البيئة (شركة المياه) - سور الاستاد", "شارع نادي المعلمين مع نجف الجامعة", "طريق الاستاد - منطقة الكرفانات"],
        logos: ["juice_box.png"],
        images: ["juice_box_menu1.jpeg", "juice_box_menu2.jpeg"]
    },
    {
        id: "11",
        name: "Rolz",
        description: "Delicious meals and a cozy dining experience crafted to satisfy every taste and moment.",
        category_id: 7,
        percentage: "15%",
        note: "رولز الخصم شغال علي المنيو الاساسي فقط وليس منيو البوكسات",
        status: "Active",
        addresses: ["تقاطع حسان بن ثابت مع المتوكل", "الإستاد أمام شارع 306", "داخل نادي طنطا"],
        logos: ["rolz.jpeg"],
        images: ["rolz_menu1.jpeg", "rolz_menu2.jpeg", "rolz_menu3.jpeg"],
    },
    {
        id: "12",
        name: "Milo",
        description: "Modern and versatile clothing crafted for style, comfort, and confidence in every occasion.",
        category_id: 1,
        percentage: "15%",
        status: "Active",
        addresses: ["اخر شارع ممتاز غرابة مع عمرو بن العاص أمام شركة الحلوجي للكمبيوتر", "شارع المتوكل مع سعيد بجوار محل سواي للفضه", "شارع احمد زكي غرابه"],
        logos: ["milo.jpeg"],
        images: []
    },
    {
        id: "13",
        name: "Eckoo",
        description: "Trendy and comfortable footwear for every style, occasion, and step of your journey.",
        category_id: 8,
        percentage: "5% extra",
        status: "Active",
        addresses: ["شارع سعيد مع صدقي - امام خير زمان", "شارع النحاس مع الفاتح - بجانب مصر للصرافه"],
        logos: ["eckoo.jpeg"],
        images: []
    },
    {
        id: "14",
        name: "Barakat",
        description: "Stylish and high-quality sun and optical glasses designed for comfort, protection, and clear vision.",
        category_id: 4,
        percentage: "15%",
        status: "Active",
        addresses: ["شارع سعيد أمام مستشفي امريكان", "بجوار مستشفي المروه"],
        logos: ["barakat.jpeg"],
        images: []
    },
    {
        id: "15",
        name: "El-Haram - الهرم",
        description: "Stylish and elegant accessories designed to complete your look and express your personality.",
        category_id: 3,
        percentage: "15-20%",
        status: "Active",
        addresses: ["المديرية مع درب الابشيهي"],
        logos: ["el-haram.jpeg"],
        images: []
    },
    {
        id: "27",
        name: "Max GYM",
        description: "A modern fitness space designed to help you build strength, improve health, and achieve your goals.",
        category_id: 5,
        percentage: "",
        status: "Soon",
        addresses: [""],
        logos: ["max_gym.jpeg"],
        images: []
    },
    {
        id: "17",
        name: "pedro",
        description: "Elegant classic shoes &  casual and sportystyle footwear",
        category_id:8 ,
        percentage: "20%",
        status: "Active",
        addresses: ["فرع الكلاسيك شارع النحاس مع هارون صدقي امام حي ثاني ", "الرشيد امام التأمين الصحي الجديد"],
        logos: ["pedro.jpeg"],
        images: []
    },
    {
        id: "18",
        name: "Vendetta",
        description: "Modern and versatile clothing crafted for style, comfort, and confidence in every occasion",
        category_id: 1,
        percentage: "15%",
        status: "Active",
        addresses: ["حسان بن ثابت مع ممتاز غرابة", "المتوكل مع احمد ذكي غرابة"],
        logos: ["vendetta.jpeg"],
        images: []
    },
    {
        id: "19",
        name: "Milky",
        description: "Delicious desserts, cakes, and sweets made fresh to satisfy every craving. Enjoy rich milkshakes and refreshing drinks crafted for the perfect sweet experience.",
        category_id:7 ,
        percentage: "10%",
        status: "Active",
        addresses: ["شارع النادي مع علي مبارك بجوار كريباوي ", "شارع سعيد مع الاشرف"],
        logos: ["milky.jpeg"],
        images: ["milky_menu1.jpeg", "milky_menu2.jpeg"]
    },
    {
        id: "20",
        name: "برقوقة",
        description: "Delicious meals and sandwiches and satisfy every taste with the secret Saudi recipe ",
        category_id: 7,
        percentage: "10%",
        status: "Active",
        addresses: ["الاستاد بجوار حديقة الطفل", "محب مع الحلو امام الشيخ جمال"],
        logos: ["barquqa.jpeg"],
        images: ["barquqa_menu1.jpeg", "barquqa_menu2.jpeg"]
    },
    {
        id: "21",
        name: "Sax's",
        description: "A cozy café serving a wide variety of hot & cold beverages, desserts, and sweet treats. The perfect place to relax, enjoy great flavors, and create memorable moments.",
        category_id:7 ,
        percentage: "15%",
        status: "Active",
        addresses: ["الاستاد امام شارع 306"],
        logos: ["saxs.jpeg"],
        images: ["saxs_menu (1).jpeg", "saxs_menu (2).jpeg", "saxs_menu (3).jpeg", "saxs_menu (4).jpeg", "saxs_menu (5).jpeg", "saxs_menu (6).jpeg", "saxs_menu (7).jpeg", "saxs_menu (8).jpeg", "saxs_menu (9).jpeg", "saxs_menu (10).jpeg", "saxs_menu (11).jpeg", "saxs_menu (12).jpeg", "saxs_menu (13).jpeg", "saxs_menu (14).jpeg", "saxs_menu (15).jpeg", "saxs_menu (16).jpeg", "saxs_menu (17).jpeg", "saxs_menu (18).jpeg", "saxs_menu (19).jpeg", "saxs_menu (20).jpeg", "saxs_menu (21).jpeg", "saxs_menu (22).jpeg", "saxs_menu (23).jpeg", "saxs_menu (24).jpeg", "saxs_menu (25).jpeg", "saxs_menu (26).jpeg", "saxs_menu (27).jpeg", "saxs_menu (28).jpeg", "saxs_menu (29).jpeg", "saxs_menu (30).jpeg", "saxs_menu (31).jpeg", "saxs_menu (32).jpeg", "saxs_menu (33).jpeg", "saxs_menu (34).jpeg", "saxs_menu (35).jpeg", "saxs_menu (36).jpeg", "saxs_menu (37).jpeg", "saxs_menu (38).jpeg"]
    },
    {
        id: "22",
        name: "Bellissimo",
        description: "Specialty coffee crafted with passion, paired with selected desserts and refreshing beverages. An elegant café experience for those who appreciate quality and taste.",
        category_id: 9,
        percentage: "soon",
        status: "soon",
        addresses: [
            "طنطا - نادى طنطا الرياضى",
            "طنطا - شارع سعيد أمام سوبر ماركت خير زمان",
            "طنطا - شارع حسان مع حسن حسيب",
            "طنطا - شارع النادي امام بوابه النشاط الرياضي",
            "طنطا - كورنيش طنطا قبل شارع 306",
            "طنطا - شارع الاشرف مول اعمار الدلتا",
            "طنطا - داخل نادى طنطا الرياضى",
            "جامعة السلام الخاصة - طريق الاسكندريه الزراعي",
            "أول كوبري قحافة - spot8 داخل مغسلة",
        ],
        logos: ["bellissimo.jpeg"],
        images: ["bellissimo_menu1.jpeg", "bellissimo_menu2.jpeg"]
    },
    {
        id: "23",
        name: "W Lounge",
        description: "A restaurant & café with a unique atmosphere, crafted to deliver exceptional vibes, delicious food, and premium drinks. Every visit is an experience worth remembering.",
        category_id:7 ,
        percentage: "20%",
        status: "Active",
        links: "https://wlounge.menuo.pro",
        addresses: ["كورنيش 306 خلف سور نادي سيتي كلوب"],
        logos: ["w_lounge.jpeg"],
        images: []
    },
    {
        id: "24",
        name: "Tea Talk",
        description: "Refreshing beverages and tasty drinks crafted to energize your day and satisfy every taste",
        category_id: 9,
        percentage: "20%",
        status: "Active",
        addresses: ["كورنيش الاستاد امام الطب الرياضي بجوار هايبر دالينا", "نادي سيتي كلوب طنطا بجوار ملاعب البادل"],
        logos: ["tea_talk.jpeg"],
        images: ["tea_talk_menu1.jpeg", "tea_talk_menu2.jpeg", "tea_talk_menu3.jpeg", "tea_talk_menu4.jpeg", "tea_talk_menu5.jpeg", "tea_talk_menu6.jpeg", "tea_talk_menu7.jpeg", "tea_talk_menu8.jpeg", "tea_talk_menu9.jpeg", "tea_talk_menu10.jpeg", "tea_talk_menu11.jpeg", "tea_talk_menu12.jpeg", "tea_talk_menu13.jpeg"]
    },
    {
        id: "25",
        name: " Oak",
        description: "A unique restaurant & café offering delicious cuisine, premium drinks, and a welcoming atmosphere. Where great food, perfect coffee, and memorable moments come together.",
        category_id: 7,
        percentage: "15%",
        status: "Active",
        addresses: ["الاستاد امام شارع 306"],
        logos: ["oak.jpeg"],
        images: ["oak_menu1.jpeg", "oak_menu2.jpeg", "oak_menu3.jpeg", "oak_menu4.jpeg", "oak_menu5.jpeg", "oak_menu6.jpeg", "oak_menu7.jpeg", "oak_menu8.jpeg", "oak_menu9.jpeg", "oak_menu10.jpeg", "oak_menu11.jpeg", "oak_menu12.jpeg", "oak_menu13.jpeg", "oak_menu14.jpeg", "oak_menu15.jpeg", "oak_menu16.jpeg", "oak_menu17.jpeg", "oak_menu18.jpeg", "oak_menu19.jpeg", "oak_menu20.jpeg", "oak_menu21.jpeg", "oak_menu22.jpeg", "oak_menu23.jpeg", "oak_menu24.jpeg", "oak_menu25.jpeg", "oak_menu26.jpeg", "oak_menu27.jpeg", "oak_menu28.jpeg"]
    },
    {
        id: "26",
        name: "shawerma city شاورما سيتي",
        description: "Authentic shawarma made with premium ingredients, bold flavors, and perfect seasoning. Serving every bite fresh for a truly satisfying experience.",
        category_id: 7,
        percentage: "15%",
        status: "Active",
        addresses: ["شارع محب بين سعيد و البحر امام كلية تربية"],
        logos: ["shawarma_city.jpeg"],
        images: ["shawarma_city_menu1.jpeg", "shawarma_city_menu2.jpeg", "shawarma_city_menu3.jpeg", "shawarma_city_menu4.jpeg"]
    },
    {
        id: "16",
        name: "ipulse gym",
        description: "A premium fitness & wellness destination combining world-class training with a luxurious spa experience. Designed for those who seek excellence, performance, and ultimate well-being.",
        category_id: 5,
        percentage: "10%",
        status: "Active",
        addresses: [" شارع قطيني متفرع من شارع سعيد "],
        logos: ["i_pulse_gym.jpeg"],
        images: []
    },
    {
        id: "28",
        name: "Fit",
        description: "Providing sports equipment and training accessories for athletes and fitness enthusiasts. Everything you need to train smarter and perform better.",
        category_id: 10,
        percentage: "5%",
        status: "Active",
        addresses: ["شارع الفاتح مع عثمان بن عفان"],
        logos: ["fit.jpeg"],
        images: []
    },
    {
        id: "29",
        name: "Eagle",
        description: "Premium sportswear designed for comfort, performance, and style. Everything you need to stay active, confident, and ready to move.",
        category_id: 10,
        percentage: "15%",
        status: "Active",
        addresses: ["عثمان بن عفان من شارع الفاتح مع شارع الشيخة صباح"],
        logos: ["eagle.jpeg"],
        images: []
    },
    {
        id: "30",
        name: "911 Ice Cream & Desserts",
        description: "A cozy café serving delicious ice cream, desserts, and sweet treats made to satisfy every craving.",
        category_id: 7,
        percentage: "10%",
        status: "Active",
        links: "https://linktr.ee/911IceCream",
        addresses: ["طنطا : شارع الاستاد - بجوار اسواق نور الدين"],
        logos: ["911.jpeg"],
        images: ["911_menu (1).jpeg", "911_menu (2).jpeg", "911_menu (3).jpeg", "911_menu (4).jpeg", "911_menu (5).jpeg", "911_menu (6).jpeg", "911_menu (7).jpeg", "911_menu (8).jpeg", "911_menu (9).jpeg", "911_menu (10).jpeg", "911_menu (11).jpeg"]
    },
    {
        id: "31",
        name: "Asayel Otour اصايل عطور",
        description: "Premium fragrances and stylish accessories, carefully selected to suit every taste.",
        category_id: 6,
        percentage: "15%",
        status: "Active",
        addresses: ["حسان بن ثابت مع المتوكل"],
        logos: ["Asayel Otour.jpeg"],
        images: []
    },
    {
        id: "32",
        name: "ten ten",
        description: "A wide selection of accessories and beauty essentials with great quality at affordable prices.",
        category_id: 3,
        percentage: "+5%",
        status: "Active",
        addresses: ["طنطا شارع الحلو بين محب والاشرف", "طنطا شارع توت عنخ آمون بجوار مستشفى طيبة"],
        logos: ["ten_ten.jpeg"],
        images: []
    },
    {
        id: "45",
        name: "Asayel Otour اصايل عطور",
        description: "Premium fragrances and stylish accessories, carefully selected to suit every taste.",
        category_id: 3,
        percentage: "15%",
        status: "Active",
        addresses: ["حسان بن ثابت مع المتوكل"],
        logos: ["Asayel Otour.jpeg"],
        images: []
    },
    {
        id: "44",
        name: "Bellissimo",
        description: "Specialty coffee crafted with passion, paired with selected desserts and refreshing beverages. An elegant café experience for those who appreciate quality and taste.",
        category_id: 7,
        percentage: "soon",
        status: "soon",
        addresses: [
            "طنطا - نادى طنطا الرياضى",
            "طنطا - شارع سعيد أمام سوبر ماركت خير زمان",
            "طنطا - شارع حسان مع حسن حسيب",
            "طنطا - شارع النادي امام بوابه النشاط الرياضي",
            "طنطا - كورنيش طنطا قبل شارع 306",
            "طنطا - شارع الاشرف مول اعمار الدلتا",
            "طنطا - داخل نادى طنطا الرياضى",
            "جامعة السلام الخاصة - طريق الاسكندريه الزراعي",
            "أول كوبري قحافة - spot8 داخل مغسلة",
        ],
        logos: ["bellissimo.jpeg"],
        images: ["bellissimo_menu1.jpeg", "bellissimo_menu2.jpeg"]
    },

{
id: "42",
name: " shawarma syria شاورما سوريا",
description: "Authentic shawarma made with premium ingredients, bold flavors, and perfect seasonigs, serving every bite fresh for a truly satisfying expierence ",
category_id:7 ,
percentage: "10%",
status: "Active",
addresses: ["شارع الحلو بجوار مدرسة قاسم امين "],
logos: ["shawarma_syria.jpeg"],
images: ["syria.1.jpg","syria.2.jpg"]
},

   {
id: "43",
name: "kukluck",
description: "Delecious meals and sandwiches and satisfy every taste with the secret recipe ",
category_id:7 ,
percentage: "15%",
status: "Active",
addresses: ["الاستاد امام شارع 306 "],
logos: ["kukluck.jpeg"],
images: ["kukluck.1.jpg","kukluck.2.jpg","kukluck.3.jpg","kukluck.4.jpg"]
}, 


{   
id: "33",
name: "واحد برجر",
description: "Freshly grilled burgers made with premium ingredients,every bite is packed with bold flavour and satsfications  ",
category_id: 7,
percentage: "10%",
status: "Active",
addresses: ["شارع البيئة - شارع شركة المياه سابقا - سور الاستاد"],
logos: ["wahed_burger.jpeg"],
images: ["wahed.1.jpg","wahed.2.jpg","wahed.3.jpg","wahed.4.jpg","wahed.5.jpg","wahed.6.jpg","wahed.7.jpg","wahed.8.jpg","wahed.9.jpg"]
},

{
id: "34",
name: "casanova coffe",
description: "A cozy cafe serving a wide variety of hot & cold beverages,dessert,and sweets treat",
category_id: 7,
percentage: "15",
status: "Active",
addresses: ["الاستاد بجوار بنك NEXT"],
logos: ["casanova.jpeg"],
images: ["casanova.1.jpg","casanova.2.jpg","casanova.3.jpg","casanova.4.jpg","casanova.5.jpg","casanova.6.jpg","casanova.7.jpg","casanova.8.jpg","casanova.9.jpg","casanova.10.jpg"]
},

    {
id: "35",
name: "shrimp pirates 15%",
description: "Fresh seafood, bold flavors, and quality in every bite, from the sea to your table-served fresh every day ",
category_id: 7,
percentage: "15%",
status: "Active",
addresses: ["طنطا-شارع المتحف"],
logos: ["shrimp_pirates.jpeg"],
images: ["shrimp.1.jpg","shrimp.2.jpg","shrimp.3.jpg","shrimp.4.jpg"]
},

    {
id: "36",
name: "واحد مطبق",
description: "Authentic Yemeni flavors served with a modern touch. From delicious shawarma and freshly baked pizzas to juicy burgers and more—crafted with quality and true hospitality.",
category_id: 7,
percentage: "10%",
status: "Active",
addresses: ["شارع المتحف من شارع سعيد "],
logos: ["wahed_metabaq.jpeg"],
images: []
},

{
id: "37",
name: "اkangro kids store ",
description: "comfortable, stylish and high-quality clothing designed to keep children looking great and feeling confident everyday",
category_id:1 ,
percentage: "upto35%",
status: "Active",
addresses: ["طنطا-شارع بطرس مع سعيد امام حي ثان"],
logos: ["kangro.jpeg"],
images: []
},

{
id: "38",
name: "البيت الفلسطيني",
description: "Experience the rich taste of authentic Palestinian cuisine, made with traditional recipes, fresh ingredients, and warm hospitality in every dish.",
category_id:7 ,
percentage: "10%",
status: "Active",
addresses: ["طنطا-بجوار سور الاستاد"],
logos: ["palstine.jpeg"],
images: []
},

{
id: "39",
name: "seven cafe",
description: "A cozy cafe serving a wide variety of hot&cold beverages, desserts, and sweet treats, the perfecy place to relax, enjoy great flavors, and create memorable moments",
category_id: 7,
percentage: "15%",
status: "Active",
addresses: ["الاستاد-شارع الحياة بجوار مديرية الشباب و الرياضة "],
logos: ["seven.jpeg"],
images: ["seven.1.jpg","seven.2.jpg"]
},

{
id: "40",
name: "Frisky",
description: "A uinque resturant&cafe offering delecious cuisine, premium drinks, and unique vibes, where great food, perfect coffe and memorable moments come togther.",
category_id: 7,
percentage: "12%",
status: "Active",
addresses: [" شارع سعيد بجوار مدرسة الامريكان"],
logos: ["frisky.jpeg"],
images: []
},

{
id: "41",
name: "منعم menem",
description: "Authentic Egyptian food with unforgettable taste.Fresh, hearty, and full of flavour.",
category_id: 7,
percentage: "10%",
status: "Active",
addresses: ["طنطا-الاستاد بجوار نادي سيتي كلوب"," الزقازيق-طلبه عويضه مع الخشاب"],
logos: ["menem.jpeg"],
images: []
},

{
id: "46",
name: "HANOVER",
description: "Specialty coffe crafted with passion, paired with selected desserts and refreshing beverages, An elegant cafe expirence with those who appreciate quality and taste",
category_id: 7,
percentage: "20%",
status: "Active",
addresses: ["الاستاد امام كورنيش المرشحة"],
logos: ["Hanover.jpeg"],
images: []
},

{
id: "47",
name: "مشلتت",
description: "Where Every Bite Feels Homemade. From crispy savory pies to rich, sweet delights, we craft every pastry with fresh ingredients and authentic flavor.Whether you're craving a hearty meal or a delicious dessert, there's always a perfect pie waiting for you.",
category_id: 7,
percentage: "10%",
status: "Active",
addresses: ["الاستاد بجوار صيدلية اسلام المنصوري - نجف الجامعة امام مطعم ولعتين"],
logos: ["meshaltet.jpeg"],
images: ["meshaltet.1.jpg","meshaltet.2.jpg"]
},
    
]
