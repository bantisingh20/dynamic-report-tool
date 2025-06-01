-- DROP TABLES IN REVERSE DEPENDENCY ORDER
DROP TABLE IF EXISTS reviews,report_configuration, payments, shipping_addresses, order_items, orders, products, categories, users;


 create TABLE report_configuration (
    report_id SERIAL PRIMARY KEY,
    report_name VARCHAR(1000) NOT NULL,
    user_id INT,
    fieldtype VARCHAR(500) NOT NULL, 
    table_name Text[],
    selected_columns Text[],
    filter_criteria JSONB[],
    group_by JSONB[],
    sort_order JSONB[],
    axis_config JSONB[] -- assuming axis_config might be structured data
);


-- USERS TABLE
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES TABLE
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

-- PRODUCTS TABLE
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INT REFERENCES categories(category_id),
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS TABLE
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    total DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER tABLE ORDERS add order_date TIMESTAMP;

-- ORDER ITEMS TABLE
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id),
    product_id INT REFERENCES products(product_id),
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

-- SHIPPING ADDRESSES
CREATE TABLE shipping_addresses (
    address_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    order_id INT REFERENCES orders(order_id),
    address_line1 VARCHAR(150),
    address_line2 VARCHAR(150),
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50),
    phone_number VARCHAR(20)
);

ALTER TABLE shipping_addresses
ALTER COLUMN address_line1 TYPE TEXT,
ALTER COLUMN address_line2 TYPE TEXT,
ALTER COLUMN city TYPE TEXT,
ALTER COLUMN state TYPE TEXT,
ALTER COLUMN zip_code TYPE TEXT,
ALTER COLUMN country TYPE TEXT,
ALTER COLUMN phone_number TYPE TEXT;

-- PAYMENTS TABLE
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id),
    payment_method VARCHAR(50), -- e.g. card, paypal
    amount DECIMAL(10, 2),
    payment_status VARCHAR(20), -- paid, failed, pending
    paid_at TIMESTAMP
);

-- PRODUCT REVIEWS
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    product_id INT REFERENCES products(product_id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



INSERT INTO categories (name) VALUES
('Electronics'),
('Books'),
('Clothing');


INSERT INTO users (name, email, password, role) VALUES
('Norma Fisher', 'ysullivan@yahoo.com', 'hashed_pwd', 'customer'),
('Heather Snow', 'juancampos@lloyd.org', 'hashed_pwd', 'customer'),
('Emily Blair', 'wcastro@yahoo.com', 'hashed_pwd', 'admin'),
('Martin Harris', 'qgrimes@gmail.com', 'hashed_pwd', 'customer'),
('Kimberly Smith', 'salazarmaria@yahoo.com', 'hashed_pwd', 'customer'),
('Frederick Harrell', 'johnponce@west.net', 'hashed_pwd', 'customer'),
('Mrs. Elizabeth Carter MD', 'tamaramorrison@hotmail.com', 'hashed_pwd', 'customer'),
('Brandon Yates', 'kellylopez@gmail.com', 'hashed_pwd', 'customer'),
('William Green', 'sheltondavid@mclean.net', 'hashed_pwd', 'customer'),
('Sara Warren', 'pattylawrence@riley-hayes.com', 'hashed_pwd', 'admin'),
('Louis Tucker', 'johndennis@gmail.com', 'hashed_pwd', 'admin'),
('Jacqueline Jackson', 'garciadustin@hotmail.com', 'hashed_pwd', 'customer'),
('Robert Walters', 'martinezjacob@wilson.com', 'hashed_pwd', 'admin'),
('Alex Woodward', 'mendozajessica@giles.net', 'hashed_pwd', 'admin'),
('Brian Green', 'lucasmichael@brown.com', 'hashed_pwd', 'customer'),
('Melissa Myers', 'rebecca79@gmail.com', 'hashed_pwd', 'admin'),
('Christina Saunders', 'matthewking@morse.biz', 'hashed_pwd', 'customer'),
('Shelly Lowery', 'qmonroe@gmail.com', 'hashed_pwd', 'admin'),
('Alexandria Harmon', 'stephensdennis@yahoo.com', 'hashed_pwd', 'admin'),
('Dwayne Howard', 'paul61@wheeler.com', 'hashed_pwd', 'customer');


INSERT INTO products (name, description, price, category_id, stock) VALUES
('Collection Education', 'Pm her then nothing increase.', 241.35, 1, 45),
('Interest Try', 'Industry product another knowledge else citizen month.', 222.74, 3, 81),
('Message Whatever', 'Page a although for study anyone state.', 457.38, 3, 61),
('Task Just', 'Nature white without study candidate.', 226.92, 3, 33),
('Administration Interest', 'First degree response able state more.', 40.52, 3, 1),
('Billion Cut', 'Part cup few read.', 55.7, 2, 90),
('Court Black', 'Take however ball ever laugh society technology.', 414.17, 3, 80),
('Cell Ready', 'Stage population boy child surface amount day.', 10.56, 2, 42),
('Event Open', 'Water voice travel among see red.', 129.52, 2, 90),
('Reality Miss', 'Policy head Mrs debate onto across character.', 436.53, 1, 72),
('Goal Green', 'Responsibility full per among clearly word.', 118.63, 1, 69),
('Figure Herself', 'Writer can boy room value film.', 229.51, 1, 40),
('Tough Necessary', 'Few structure federal board.', 438.79, 2, 13),
('Option When', 'Listen subject wish gas look record interview.', 157.71, 2, 90),
('Five Government', 'Turn phone heart window.', 71.16, 2, 69),
('Purpose Begin', 'Space cup determine his.', 109.57, 3, 70),
('Billion Indeed', 'Million large major once quickly institution happy.', 297.93, 2, 11),
('Every Pay', 'Issue grow ask tell.', 302.18, 2, 40),
('Science Ahead', 'Later quality budget huge debate among way.', 292.07, 2, 23),
('Direction Price', 'Bit learn gun still.', 102.8, 1, 4),
('Book Pick', 'Chance image quite there many true follow.', 310.26, 3, 33),
('Moment Moment', 'Myself use act relationship section.', 243.5, 1, 86),
('Friend Television', 'Along chance either six success on.', 381.23, 1, 4),
('Serious Seat', 'At be than always different American address.', 422.81, 3, 69),
('Three List', 'Technology song than leave he him.', 344.91, 3, 67),
('Next Morning', 'Off question source.', 145.06, 1, 27),
('Son Plan', 'Section town deal movement.', 448.57, 3, 53),
('Piece Key', 'Suddenly win parent do ten after those.', 294.05, 2, 63),
('Sit Court', 'Medical effort assume teacher wall.', 333.52, 3, 45),
('Floor Spring', 'His himself clearly very dream role.', 50.36, 3, 14);



INSERT INTO orders (user_id, order_date, status, total) VALUES
(16, '2024-10-05', 'delivered', 0),
(11, '2025-02-25', 'cancelled', 0),
(20, '2024-08-20', 'pending', 0),
(2, '2025-04-16', 'pending', 0),
(14, '2024-09-19', 'pending', 0),
(2, '2024-11-08', 'pending', 0),
(2, '2024-10-14', 'shipped', 0),
(16, '2025-02-12', 'cancelled', 0),
(18, '2025-01-30', 'pending', 0),
(10, '2024-08-20', 'delivered', 0),
(7, '2025-05-26', 'delivered', 0),
(2, '2024-10-13', 'cancelled', 0),
(15, '2024-07-07', 'cancelled', 0),
(7, '2024-09-24', 'pending', 0),
(17, '2025-05-20', 'pending', 0),
(3, '2024-08-21', 'pending', 0),
(4, '2024-10-03', 'shipped', 0),
(20, '2024-08-22', 'cancelled', 0),
(5, '2025-02-13', 'shipped', 0),
(6, '2025-03-15', 'shipped', 0),
(10, '2025-04-19', 'shipped', 0),
(18, '2024-10-07', 'cancelled', 0),
(2, '2024-07-13', 'delivered', 0),
(7, '2025-03-05', 'shipped', 0),
(7, '2025-03-28', 'cancelled', 0),
(3, '2024-09-12', 'pending', 0),
(7, '2024-11-25', 'shipped', 0),
(19, '2025-03-21', 'cancelled', 0),
(18, '2024-11-22', 'shipped', 0),
(20, '2025-03-24', 'shipped', 0);



INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 28, 2, 129.09),
(1, 24, 3, 67.4),
(2, 27, 1, 59.3),
(2, 5, 2, 32.16),
(3, 1, 1, 321.15),
(3, 20, 5, 68.65),
(4, 7, 2, 361.88),
(4, 16, 2, 366.31),
(5, 27, 3, 44.3),
(5, 3, 3, 181.64),
(6, 23, 4, 107.68),
(6, 12, 4, 420.78),
(7, 28, 2, 177.73),
(7, 9, 1, 302.43),
(8, 29, 5, 438.65),
(8, 30, 3, 327.98),
(9, 15, 1, 174.6),
(9, 2, 5, 147.63),
(10, 19, 5, 74.85),
(10, 10, 4, 376.76),
(11, 6, 2, 119.32),
(11, 15, 4, 358.07),
(12, 28, 5, 214.93),
(12, 22, 1, 91.18),
(13, 30, 5, 305.95),
(13, 1, 1, 252.35),
(14, 27, 2, 493.54),
(14, 13, 4, 164.93),
(15, 7, 1, 308.1),
(15, 7, 3, 147.19),
(16, 9, 4, 401.91),
(16, 4, 3, 75.38),
(17, 9, 1, 30.73),
(17, 7, 3, 283.59),
(18, 23, 4, 323.67),
(18, 12, 5, 97.36),
(19, 9, 3, 175.38),
(19, 12, 1, 175.75),
(20, 19, 3, 186.84),
(20, 18, 2, 153.77),
(21, 28, 5, 367.04),
(21, 10, 4, 419.42),
(22, 16, 3, 422.02),
(22, 26, 3, 70.92),
(23, 11, 2, 460.65),
(23, 21, 5, 194.03),
(24, 2, 4, 13.85),
(24, 13, 5, 264.31),
(25, 3, 3, 117.87),
(25, 9, 5, 390.78),
(26, 29, 5, 231.29),
(26, 22, 2, 68.27),
(27, 4, 2, 234.62),
(27, 12, 5, 415.22),
(28, 21, 4, 440.05),
(28, 16, 3, 418.43),
(29, 1, 3, 355.74),
(29, 24, 3, 410.88),
(30, 27, 4, 295.64),
(30, 23, 4, 42.52);


INSERT INTO shipping_addresses (order_id, address_line1, city, state, zip_code, country) VALUES
(1, '6279 Emily Drive, Robertmouth, NH 06665', 'South Kimberlytown', 'PA', '81424', 'Bulgaria'),
(2, '194 Susan Loaf Suite 183, Port Philipstad, ID 60200', 'Kristineland', 'AZ', '64223', 'Equatorial Guinea'),
(3, '412 Snow Manors Apt. 161, South Kimtown, NV 57004', 'Johnsonmouth', 'KS', '10795', 'Guinea'),
(4, 'Unit 5192 Box 3031, DPO AP 01442', 'Miketown', 'IN', '19098', 'Colombia'),
(5, '91189 Moore Drive Apt. 358, East Kari, MN 55523', 'Port Davidtown', 'CA', '92535', 'Barbados'),
(6, '37580 Ortiz Mall Suite 735, Stephanieland, WY 14737', 'Danielberg', 'UT', '58980', 'Vanuatu'),
(7, '3407 Smith Hills, Port Tiffanyport, PA 20977', 'Mccarthyfort', 'TX', '65732', 'Senegal'),
(8, '8967 Julie Knoll Suite 391, North Lauraport, MA 15991', 'Port Frank', 'LA', '37561', 'Maldives'),
(9, '7592 David Crest Suite 697, New Elizabeth, SC 62454', 'Robinsonfort', 'NY', '42213', 'Lithuania'),
(10, '0811 Smith Canyon Apt. 904, Jessicabury, WV 75585', 'Jameschester', 'VT', '43780', 'Hungary'),
(11, '32756 Roman Loaf Apt. 373, South Arthurland, HI 48160', 'Lake Danielleburgh', 'RI', '39498', 'New Caledonia'),
(12, '886 Henry Squares, Lewisview, AZ 07389', 'West Adam', 'AL', '18904', 'Bahrain'),
(13, '5875 Johnson Cape, West Christopher, NC 45818', 'Port James', 'VA', '96917', 'Gabon'),
(14, 'USS Smith, FPO AA 95476', 'Williamschester', 'NH', '58186', 'British Indian Ocean Territory (Chagos Archipelago)'),
(15, '8602 Tracy Crossroad, Sarahmouth, CT 73515', 'Chelseaborough', 'LA', '58406', 'Malawi'),
(16, '886 David Rue, Davidshire, IN 88959', 'Jeffreybury', 'NC', '40808', 'Peru'),
(17, '62281 Kathy Tunnel, Hudsonborough, VA 17819', 'Port Patrick', 'OR', '17873', 'Niue'),
(18, '778 Padilla Common, Derrickfurt, ID 41974', 'Patrickton', 'AZ', '41809', 'Saint Kitts and Nevis'),
(19, '9802 Johnson Road, North Johntown, SD 43318', 'Port Bryanchester', 'IL', '59347', 'Jordan'),
(20, '4887 Annette Crossing, Finleyburgh, NY 18618', 'North Mark', 'HI', '32848', 'Yemen'),
(21, '169 Christine Mount, New Carolyn, MA 97234', 'Johnsonton', 'CO', '47472', 'French Guiana'),
(22, '0484 Madden Trail Suite 076, South Michaelton, KY 97488', 'West Erinshire', 'WI', '38482', 'Poland'),
(23, '98522 Mathis Viaduct Apt. 909, West Michael, LA 42837', 'Pattonchester', 'AL', '18950', 'Mongolia'),
(24, '931 Ramirez Village Apt. 821, New Daniel, SC 71728', 'Fischerview', 'LA', '02288', 'Japan'),
(25, '82965 Herring Points, Fieldsbury, AK 47978', 'Lake James', 'SC', '92263', 'Luxembourg'),
(26, '97378 Susan Expressway Suite 166, Johnnystad, MD 12379', 'Anthonytown', 'KS', '27080', 'Serbia'),
(27, '450 Wells Pike, North Christopher, MI 47820', 'North Jamesville', 'ND', '62249', 'Aruba'),
(28, '292 Delacruz Pass Apt. 222, Thorntonton, NC 06198', 'Herringstad', 'OR', '11353', 'Belgium'),
(29, 'Unit 2782 Box 0928, DPO AE 99813', 'Lisaland', 'SD', '60341', 'New Caledonia'),
(30, '501 Ronald Knoll, Rogersfurt, MN 83937', 'East Logantown', 'VA', '16898', 'Andorra');



INSERT INTO payments (order_id, amount, payment_method, payment_status, paid_at) VALUES
(1, 460.38, 'credit_card', 'pending', '2024-10-05'),
(2, 123.62, 'bank_transfer', 'failed', '2025-02-25'),
(3, 664.40, 'credit_card', 'pending', '2024-08-20'),
(4, 1456.38, 'credit_card', 'failed', '2025-04-16'),
(5, 677.82, 'credit_card', 'paid', '2024-09-19'),
(6, 2113.84, 'bank_transfer', 'paid', '2024-11-08'),
(7, 657.89, 'paypal', 'failed', '2024-10-14'),
(8, 3177.19, 'paypal', 'failed', '2025-02-12'),
(9, 912.75, 'credit_card', 'pending', '2025-01-30'),
(10, 1881.29, 'bank_transfer', 'paid', '2024-08-20'),
(11, 1670.92, 'bank_transfer', 'failed', '2025-05-26'),
(12, 1165.83, 'credit_card', 'pending', '2024-10-13'),
(13, 1782.10, 'paypal', 'pending', '2024-07-07'),
(14, 1646.80, 'credit_card', 'paid', '2024-09-24'),
(15, 749.67, 'credit_card', 'paid', '2025-05-20'),
(16, 1833.78, 'bank_transfer', 'failed', '2024-08-21'),
(17, 881.50, 'paypal', 'failed', '2024-10-03'),
(18, 1781.48, 'paypal', 'failed', '2024-08-22'),
(19, 701.89, 'bank_transfer', 'paid', '2025-02-13'),
(20, 868.06, 'paypal', 'failed', '2025-03-15'),
(21, 3512.88, 'paypal', 'pending', '2025-04-19'),
(22, 1478.82, 'credit_card', 'failed', '2024-10-07'),
(23, 1891.45, 'bank_transfer', 'paid', '2024-07-13'),
(24, 1376.95, 'paypal', 'pending', '2025-03-05'),
(25, 2307.51, 'paypal', 'paid', '2025-03-28'),
(26, 1292.99, 'paypal', 'pending', '2024-09-12'),
(27, 2545.34, 'credit_card', 'failed', '2024-11-25'),
(28, 3015.49, 'paypal', 'failed', '2025-03-21'),
(29, 2299.86, 'credit_card', 'failed', '2024-11-22'),
(30, 1352.64, 'credit_card', 'failed', '2025-03-24');


INSERT INTO reviews (user_id, product_id, rating, comment, created_at) VALUES
(16, 26, 2, 'Food record power crime situation since book art.', '2024-10-05'),
(11, 30, 5, 'War project occur.', '2025-02-25'),
(20, 27, 1, 'Building reality generation concern.', '2024-08-20'),
(2, 1, 5, 'Both general where candidate whom gun list.', '2025-04-16'),
(14, 17, 4, 'Inside nearly scientist central.', '2024-09-19'),
(2, 23, 2, 'Control instead company where future model.', '2024-11-08'),
(2, 6, 1, 'Myself if place again establish.', '2024-10-14'),
(16, 9, 2, 'Off phone most improve.', '2025-02-12'),
(18, 12, 5, 'Know central many thought.', '2025-01-30'),
(10, 1, 5, 'Former possible reach challenge.', '2024-08-20'),
(7, 28, 4, 'Relate mention expect there.', '2025-05-26'),
(2, 23, 2, 'Quite wife however TV law fund.', '2024-10-13'),
(15, 2, 4, 'Might his lot the drive.', '2024-07-07'),
(7, 23, 1, 'Bank better she increase.', '2024-09-24'),
(17, 16, 4, 'Left plant evening admit past Republican common increase.', '2025-05-20'),
(3, 21, 3, 'Do pick expert commercial special network.', '2024-08-21'),
(4, 30, 1, 'Too blue street money grow lay actually.', '2024-10-03'),
(20, 10, 1, 'Gas kid rise price employee.', '2024-08-22'),
(5, 2, 3, 'Group computer forget would.', '2025-02-13'),
(6, 8, 1, 'What to sea.', '2025-03-15'),
(10, 4, 1, 'Leader medical class send.', '2025-04-19'),
(18, 16, 4, 'Several might history strong economy.', '2024-10-07'),
(2, 3, 1, 'Kind game act.', '2024-07-13'),
(7, 26, 5, 'Watch Mrs never wrong couple.', '2025-03-05'),
(7, 12, 1, 'Room eat through.', '2025-03-28'),
(3, 7, 1, 'Hit simple personal home they although.', '2024-09-12'),
(7, 16, 2, 'Up suddenly war fire town worker.', '2024-11-25'),
(19, 22, 2, 'Company enter son foreign remember site military.', '2025-03-21'),
(18, 5, 3, 'Speech mission remember tree care.', '2024-11-22'),
(20, 28, 1, 'Though cover including artist find hope.', '2025-03-24');
