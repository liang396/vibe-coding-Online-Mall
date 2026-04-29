 数据库表设计
1. 用户表 users
字段名	类型	描述	主键/外键
user_id	INT	用户ID	主键
username	VARCHAR(50)	用户名	唯一
password	VARCHAR(255)	密码	
email	VARCHAR(100)	邮箱	唯一
phone	VARCHAR(20)	电话	
role	ENUM('buyer','seller','admin')	用户角色	
created_at	DATETIME	注册时间	
updated_at	DATETIME	更新时间	
1. 商品表 products
字段名	类型	描述	主键/外键
product_id	INT	商品ID	主键
seller_id	INT	卖家ID	外键 -> users.user_id
name	VARCHAR(100)	商品名称	
description	TEXT	商品描述	
price	DECIMAL(10,2)	商品价格	
stock	INT	库存数量	
category_id	INT	分类ID	外键 -> categories.category_id
status	ENUM('on_sale','sold_out','off_shelf')	商品状态	
created_at	DATETIME	上架时间	
updated_at	DATETIME	更新时间	
1. 商品分类表 categories
字段名	类型	描述	主键/外键
category_id	INT	分类ID	主键
name	VARCHAR(50)	分类名称	
parent_id	INT	父级分类ID	外键 -> categories.category_id，可空
created_at	DATETIME	创建时间	
updated_at	DATETIME	更新时间	
1. 订单表 orders
字段名	类型	描述	主键/外键
order_id	INT	订单ID	主键
buyer_id	INT	买家ID	外键 -> users.user_id
total_price	DECIMAL(10,2)	总金额	
status	ENUM('pending','paid','shipped','completed','cancelled')	订单状态	
created_at	DATETIME	下单时间	
updated_at	DATETIME	更新时间	
1. 订单明细表 order_items
字段名	类型	描述	主键/外键
order_item_id	INT	明细ID	主键
order_id	INT	订单ID	外键 -> orders.order_id
product_id	INT	商品ID	外键 -> products.product_id
quantity	INT	数量	
price	DECIMAL(10,2)	单价	
1. 评论表 reviews
字段名	类型	描述	主键/外键
review_id	INT	评论ID	主键
product_id	INT	商品ID	外键 -> products.product_id
user_id	INT	用户ID	外键 -> users.user_id
rating	INT	评分（1-5）	
comment	TEXT	评论内容	
created_at	DATETIME	评论时间	

💡 提示：

所有表的 created_at 和 updated_at 建议自动更新。
用户角色字段可以扩展支持管理员权限控制。
可以考虑增加购物车表 cart_items 和支付流水表 payments，便于后续拓展支付功能。