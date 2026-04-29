INSERT INTO categories (category_id, name, parent_id)
VALUES
    (1, '数码配件', NULL),
    (2, '学习书籍', NULL),
    (3, '宿舍家居', NULL),
    (4, '服饰鞋包', NULL),
    (5, '运动户外', NULL),
    (6, '影音娱乐', NULL)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    parent_id = VALUES(parent_id);

INSERT INTO users (user_id, username, password, email, phone, role)
VALUES
    (101, '阿青数码铺', '$2a$10$nRT/sPa/Jh0uq57sXmAKq.orpsaC7Zn1g/lTRHHFIV5ITsbBnO55a', 'aqing.seller@example.com', '13800138001', 'seller'),
    (102, '小禾书摊', '$2a$10$nRT/sPa/Jh0uq57sXmAKq.orpsaC7Zn1g/lTRHHFIV5ITsbBnO55a', 'xiaohe.books@example.com', '13800138002', 'seller'),
    (103, '阿林宿舍集市', '$2a$10$nRT/sPa/Jh0uq57sXmAKq.orpsaC7Zn1g/lTRHHFIV5ITsbBnO55a', 'alin.market@example.com', '13800138003', 'seller'),
    (104, '可可衣橱', '$2a$10$nRT/sPa/Jh0uq57sXmAKq.orpsaC7Zn1g/lTRHHFIV5ITsbBnO55a', 'keke.style@example.com', '13800138004', 'seller'),
    (105, '远山运动仓', '$2a$10$nRT/sPa/Jh0uq57sXmAKq.orpsaC7Zn1g/lTRHHFIV5ITsbBnO55a', 'yuanshan.sport@example.com', '13800138005', 'seller')
ON DUPLICATE KEY UPDATE
    username = VALUES(username),
    password = VALUES(password),
    email = VALUES(email),
    phone = VALUES(phone),
    role = VALUES(role);

INSERT INTO products (product_id, seller_id, name, description, image_url, price, stock, category_id, status)
VALUES
    (1001, 101, '87键机械键盘', '热插拔青轴，支持蓝牙和有线双模，适合宿舍和办公室使用。', 'https://placehold.co/900x700/F3E8D8/1F2937?text=Mechanical+Keyboard', 179.00, 5, 1, 'on_sale'),
    (1002, 101, '降噪头戴耳机', '续航稳定，耳罩成色不错，通勤和自习室都能用。', 'https://placehold.co/900x700/E8EEF7/1F2937?text=Headphones', 219.00, 3, 6, 'on_sale'),
    (1003, 101, 'USB-C 扩展坞', '带 HDMI、USB 3.0 和读卡口，适配常见轻薄本。', 'https://placehold.co/900x700/E7F0EC/1F2937?text=USB-C+Dock', 89.00, 7, 1, 'on_sale'),
    (1004, 101, '便携显示器 15.6 寸', '1080P IPS 屏，带保护套，适合做副屏。', 'https://placehold.co/900x700/F6E7E1/1F2937?text=Portable+Monitor', 399.00, 2, 1, 'on_sale'),
    (1005, 101, '磁吸充电宝 10000mAh', '支持 20W 快充，容量健康，机身轻便。', 'https://placehold.co/900x700/EEEADF/1F2937?text=Power+Bank', 129.00, 6, 1, 'on_sale'),
    (1006, 101, 'Logitech 无线鼠标', '静音按键，滚轮顺滑，表面轻微使用痕迹。', 'https://placehold.co/900x700/E6EDF5/1F2937?text=Wireless+Mouse', 69.00, 8, 1, 'on_sale'),

    (1007, 102, '大学英语六级真题集', '近年真题整理版，重点题型有标注和笔记。', 'https://placehold.co/900x700/F8ECD7/1F2937?text=CET-6+Book', 28.00, 9, 2, 'on_sale'),
    (1008, 102, '计算机网络教材', '教材内页干净，附课程思维导图和复习提纲。', 'https://placehold.co/900x700/EEF3F9/1F2937?text=Networking+Textbook', 36.00, 4, 2, 'on_sale'),
    (1009, 102, '线性代数习题解析', '适合考研复习，题解详细，少量荧光笔标记。', 'https://placehold.co/900x700/F4F0E6/1F2937?text=Linear+Algebra', 22.00, 5, 2, 'on_sale'),
    (1010, 102, '新闻传播学考研笔记', '按章节整理，含热点专题和答题模板。', 'https://placehold.co/900x700/E7F2EE/1F2937?text=Media+Notes', 48.00, 3, 2, 'on_sale'),
    (1011, 102, '日语 N2 词汇书', '词频高，书角轻微磨损，适合冲刺阶段查漏补缺。', 'https://placehold.co/900x700/F7E8E2/1F2937?text=JLPT+N2', 24.00, 6, 2, 'on_sale'),
    (1012, 102, 'Python 数据分析入门', '带大量注释和案例，适合新手快速上手。', 'https://placehold.co/900x700/E8EEF6/1F2937?text=Python+Data+Analysis', 42.00, 4, 2, 'on_sale'),

    (1013, 103, '折叠笔记本支架', '铝合金材质，角度可调，适合宿舍桌面整理。', 'https://placehold.co/900x700/F1E6D8/1F2937?text=Laptop+Stand', 39.00, 10, 3, 'on_sale'),
    (1014, 103, '宿舍暖光台灯', '三档亮度调节，底座稳，适合夜间自习。', 'https://placehold.co/900x700/EEF4FB/1F2937?text=Desk+Lamp', 45.00, 6, 3, 'on_sale'),
    (1015, 103, '可折叠脏衣篮', '容量大，收纳方便，搬宿舍时也好带走。', 'https://placehold.co/900x700/EAF4EE/1F2937?text=Laundry+Basket', 19.90, 12, 3, 'on_sale'),
    (1016, 103, '桌面收纳抽屉盒', '多格分区，可放数据线、文具和小零件。', 'https://placehold.co/900x700/F5E9E4/1F2937?text=Storage+Box', 26.00, 7, 3, 'on_sale'),
    (1017, 103, '记忆棉靠背坐垫', '适合久坐学习，回弹不错，外套可拆洗。', 'https://placehold.co/900x700/F2EFE8/1F2937?text=Seat+Cushion', 58.00, 5, 3, 'on_sale'),
    (1018, 103, '迷你空气循环扇', '宿舍静音款，小巧不占地，可 USB 供电。', 'https://placehold.co/900x700/E6EEF7/1F2937?text=Mini+Fan', 49.00, 8, 3, 'on_sale'),

    (1019, 104, '米白色风衣外套', '版型利落，春秋通勤都能穿，清洗后发货。', 'https://placehold.co/900x700/F3E6D9/1F2937?text=Trench+Coat', 128.00, 2, 4, 'on_sale'),
    (1020, 104, '复古牛仔半裙', '高腰设计，面料挺括，适合日常穿搭。', 'https://placehold.co/900x700/EEF2F7/1F2937?text=Denim+Skirt', 66.00, 3, 4, 'on_sale'),
    (1021, 104, '帆布双肩包', '电脑层完好，容量大，短途出行很方便。', 'https://placehold.co/900x700/E9F2EC/1F2937?text=Canvas+Backpack', 72.00, 4, 4, 'on_sale'),
    (1022, 104, '小白鞋 38 码', '鞋底磨损轻，鞋面已清洁，适合日常替换穿。', 'https://placehold.co/900x700/F7E9E1/1F2937?text=White+Sneakers', 88.00, 1, 4, 'on_sale'),
    (1023, 104, '羊毛围巾', '柔软不扎，颜色百搭，冬天通勤实用。', 'https://placehold.co/900x700/F1ECE4/1F2937?text=Wool+Scarf', 35.00, 6, 4, 'on_sale'),
    (1024, 104, '银色极简手表', '走时正常，表带有轻微使用痕迹。', 'https://placehold.co/900x700/E7EDF5/1F2937?text=Minimal+Watch', 149.00, 2, 4, 'on_sale'),

    (1025, 105, '瑜伽垫 8mm', '防滑耐用，卷起后不占地方，适合宿舍健身。', 'https://placehold.co/900x700/F5E7D8/1F2937?text=Yoga+Mat', 39.00, 7, 5, 'on_sale'),
    (1026, 105, '羽毛球拍双拍套装', '附拍套，拉线完整，适合周末约球。', 'https://placehold.co/900x700/ECF3FB/1F2937?text=Badminton+Set', 96.00, 3, 5, 'on_sale'),
    (1027, 105, '智能跳绳', '可计数和计时，手柄握感舒适。', 'https://placehold.co/900x700/E7F1EB/1F2937?text=Smart+Jump+Rope', 32.00, 9, 5, 'on_sale'),
    (1028, 105, '户外保温水壶', '容量 750ml，密封良好，适合通勤和健身房。', 'https://placehold.co/900x700/F7EAE3/1F2937?text=Thermo+Bottle', 44.00, 5, 5, 'on_sale'),
    (1029, 105, '臂包跑步手机袋', '夜跑反光条设计，适合 6.7 寸以内手机。', 'https://placehold.co/900x700/F3EFE6/1F2937?text=Running+Arm+Bag', 18.00, 11, 5, 'on_sale'),
    (1030, 105, '露营折叠椅', '承重稳定，收纳后体积小，周末露营很方便。', 'https://placehold.co/900x700/E7EEF6/1F2937?text=Camping+Chair', 79.00, 4, 5, 'on_sale')
ON DUPLICATE KEY UPDATE
    seller_id = VALUES(seller_id),
    name = VALUES(name),
    description = VALUES(description),
    image_url = VALUES(image_url),
    price = VALUES(price),
    stock = VALUES(stock),
    category_id = VALUES(category_id),
    status = VALUES(status);
