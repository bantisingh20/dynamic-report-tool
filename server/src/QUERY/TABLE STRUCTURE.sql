-- reviews, payments, shipping_addresses, order_items, orders, products, categories, users;


select * from users  --1 user table 
select * from categories  -- this contain product category
select * from products -- this containlist of product based on category
select * from orders -- this contain list of order by users
select * from order_items -- this contain list of prodcut which user order 
select * From shipping_addresses -- this contain list of addres basedon order for shipping
select * from payments -- this contain list of payment details by order 
select * from review -- this contain list of review based on products