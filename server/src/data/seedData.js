/**
 * Realistic demo data. Values are NOT typed here — every estimated swap value
 * is computed by the value calculator during seeding.
 */

const users = [
  { name: 'Ananya Sharma', email: 'ananya@demo.rewear.app', city: 'New Delhi', area: 'Lajpat Nagar', showArea: true, bio: 'Minimalist wardrobe in progress. Love linen, kurtas and anything vintage.' },
  { name: 'Rohan Mehta', email: 'rohan@demo.rewear.app', city: 'Gurugram', area: 'DLF Phase 3', showArea: false, bio: 'Sneakerhead trying to buy less and swap more.' },
  { name: 'Priya Nair', email: 'priya@demo.rewear.app', city: 'Noida', area: 'Sector 62', showArea: true, bio: 'Office-wear swaps welcome. Size S/M.' },
  { name: 'Kabir Singh', email: 'kabir@demo.rewear.app', city: 'Chandigarh', area: 'Sector 17', showArea: false, bio: 'Outdoor gear and winter jackets.' },
  { name: 'Meera Iyer', email: 'meera@demo.rewear.app', city: 'Bengaluru', area: 'Indiranagar', showArea: true, bio: 'Dresses, sarees and handloom lover.' },
  { name: 'Arjun Reddy', email: 'arjun@demo.rewear.app', city: 'Hyderabad', area: 'Gachibowli', showArea: false, bio: 'Gym and running gear, mostly size L.' },
  { name: 'Sneha Kulkarni', email: 'sneha@demo.rewear.app', city: 'Pune', area: 'Koregaon Park', showArea: true, bio: 'Swapping my college wardrobe for work basics.' },
  { name: 'Vikram Joshi', email: 'vikram@demo.rewear.app', city: 'Mumbai', area: 'Bandra West', showArea: false, bio: 'Denim collector. Will trade for good jackets.' },
  { name: 'Ishita Banerjee', email: 'ishita@demo.rewear.app', city: 'Kolkata', area: 'Salt Lake', showArea: true, bio: 'Handloom, cotton and Durga Puja outfits.' },
  { name: 'Aditya Verma', email: 'aditya@demo.rewear.app', city: 'Jaipur', area: 'Malviya Nagar', showArea: false, bio: 'Ethnic wear for weddings — wore once, ready for a new home.' },
];

// [ownerIndex, title, category, clothingType, audience, brand, size, condition, color, description]
const listings = [
  [0, "Levi's 511 Slim Jeans", 'jeans', 'Slim-fit jeans', 'men', "Levi's", '32', 'like_new', 'Indigo', 'Dark indigo 511 slim fit, worn a handful of times. No fading or fraying at the hems.'],
  [0, 'Fabindia Cotton Kurta', 'ethnic', 'Kurta', 'women', 'Fabindia', 'M', 'good', 'Mustard', 'Block-printed cotton kurta with wooden buttons. Soft after washing, perfect for summer.'],
  [0, 'Zara Linen Blend Shirt', 'shirts', 'Linen shirt', 'women', 'Zara', 'S', 'like_new', 'White', 'Relaxed fit linen-blend shirt with a camp collar. Breathable and easy to dress up or down.'],
  [0, 'H&M Ribbed Knit Top', 'tops', 'Knit top', 'women', 'H&M', 'S', 'good', 'Beige', 'Fitted ribbed knit top, square neckline. Light pilling under the arms, otherwise great.'],
  [1, 'Nike Air Max 270', 'footwear', 'Sneakers', 'men', 'Nike', 'UK 9', 'good', 'Black', 'Comfortable everyday trainers. Soles in good shape, minor creasing on the toe box.'],
  [1, 'Adidas Essentials Hoodie', 'sweaters', 'Hoodie', 'unisex', 'Adidas', 'L', 'like_new', 'Grey', 'Fleece-lined pullover hoodie with the three-stripe sleeves. Super warm, barely worn.'],
  [1, 'Tommy Hilfiger Polo T-Shirt', 'tshirts', 'Polo t-shirt', 'men', 'Tommy Hilfiger', 'M', 'good', 'Navy', 'Classic pique polo with embroidered logo. Colour still deep, collar keeps its shape.'],
  [1, 'Puma Running Shorts', 'activewear', 'Running shorts', 'men', 'Puma', 'L', 'like_new', 'Black', 'Lightweight dryCELL running shorts with a zip pocket. Used for two races.'],
  [2, 'Allen Solly Formal Trousers', 'trousers', 'Formal trousers', 'women', 'Allen Solly', '28', 'like_new', 'Charcoal', 'Tailored straight-leg trousers, ideal for office. Dry cleaned and ready to wear.'],
  [2, 'Mango Wrap Midi Dress', 'dresses', 'Wrap dress', 'women', 'Mango', 'S', 'new_with_tags', 'Floral', 'Floral wrap midi dress with flutter sleeves. Bought for an event, never worn — tags attached.'],
  [2, 'Van Heusen Blazer', 'jackets', 'Blazer', 'women', 'Van Heusen', 'M', 'good', 'Navy', 'Single-button office blazer with lined interior. Small mark on the inner lining only.'],
  [2, 'Only Denim Jacket', 'jackets', 'Denim jacket', 'women', 'Only', 'S', 'good', 'Light Blue', 'Cropped light-wash denim jacket. Classic layering piece, slight fade at the cuffs.'],
  [3, 'The North Face Puffer Jacket', 'jackets', 'Puffer jacket', 'men', 'The North Face', 'L', 'like_new', 'Black', 'Insulated 700-fill puffer, kept me warm through two Shimla trips. No tears, zips perfect.'],
  [3, 'Woodland Leather Boots', 'footwear', 'Hiking boots', 'men', 'Woodland', 'UK 10', 'good', 'Brown', 'Sturdy leather trekking boots. Re-polished, soles have plenty of life left.'],
  [3, 'Decathlon Fleece Jacket', 'sweaters', 'Fleece', 'unisex', 'Decathlon', 'M', 'good', 'Green', 'Quechua full-zip fleece. Great mid-layer for hikes.'],
  [3, 'Columbia Trekking Pants', 'trousers', 'Convertible trousers', 'men', 'Columbia', '32', 'fair', 'Khaki', 'Zip-off convertible pants. Some wear on the knees but fully functional.'],
  [4, 'Handloom Cotton Saree', 'ethnic', 'Saree', 'women', 'Nalli', 'Free Size', 'like_new', 'Maroon', 'Soft handloom cotton saree with a contrast border. Blouse piece included.'],
  [4, 'Biba Anarkali Suit', 'ethnic', 'Anarkali', 'women', 'Biba', 'M', 'good', 'Teal', 'Flared anarkali with dupatta. Worn to two family functions.'],
  [4, 'W Floral Maxi Dress', 'dresses', 'Maxi dress', 'women', 'W', 'M', 'like_new', 'Pink', 'Flowy maxi dress with a tie waist. Lightweight rayon, great for beach holidays.'],
  [4, 'Coach Leather Tote', 'accessories', 'Tote bag', 'women', 'Coach', 'Free Size', 'good', 'Tan', 'Genuine leather tote with interior zip pocket. Light scuffs on the base corners.'],
  [5, 'Nike Dri-FIT Training Tee', 'activewear', 'Training t-shirt', 'men', 'Nike', 'L', 'good', 'Blue', 'Moisture-wicking gym tee. Slight fading from washes.'],
  [5, 'Under Armour Track Jacket', 'activewear', 'Track jacket', 'men', 'Under Armour', 'L', 'like_new', 'Black', 'Full-zip track jacket with thumb holes. Worn a few times for evening runs.'],
  [5, 'New Balance 574 Sneakers', 'footwear', 'Sneakers', 'unisex', 'New Balance', 'UK 8', 'good', 'Grey', 'Classic suede 574s. Cleaned and deodorised.'],
  [5, 'Roadster Checked Shirt', 'shirts', 'Flannel shirt', 'men', 'Roadster', 'L', 'fair', 'Red', 'Soft brushed-cotton check shirt. One button replaced, colour faded slightly.'],
  [6, 'Uniqlo Merino Sweater', 'sweaters', 'Crew-neck sweater', 'women', 'Uniqlo', 'S', 'like_new', 'Cream', 'Extra-fine merino crew neck. Hand washed only, no pilling.'],
  [6, 'Vero Moda High-Rise Jeans', 'jeans', 'Skinny jeans', 'women', 'Vero Moda', '28', 'good', 'Black', 'High-rise stretch skinny jeans. Comfortable, colour still rich.'],
  [6, 'Forever 21 Satin Slip Top', 'tops', 'Camisole', 'women', 'Forever 21', 'S', 'new_with_tags', 'Olive', 'Satin cami with adjustable straps. Never worn.'],
  [6, 'Converse Chuck Taylor All Star', 'footwear', 'Canvas sneakers', 'unisex', 'Converse', 'UK 6', 'good', 'White', 'High-top classics, freshly washed. Minor marks on the rubber toe caps.'],
  [7, "Levi's Trucker Jacket", 'jackets', 'Denim jacket', 'men', "Levi's", 'L', 'good', 'Denim', 'The original trucker jacket in mid-wash. Broken-in perfectly.'],
  [7, 'Jack & Jones Straight Jeans', 'jeans', 'Straight jeans', 'men', 'Jack & Jones', '34', 'like_new', 'Blue', 'Straight-fit mid-wash jeans. Hemmed once to 32" length.'],
  [7, 'Calvin Klein Crew-Neck Tee', 'tshirts', 'Logo t-shirt', 'men', 'Calvin Klein', 'M', 'good', 'White', 'Soft cotton tee with a small chest logo.'],
  [7, 'Ralph Lauren Oxford Shirt', 'shirts', 'Oxford shirt', 'men', 'Ralph Lauren', 'M', 'like_new', 'Light Blue', 'Custom-fit Oxford button-down. Crisp and barely worn.'],
  [8, 'Tant Cotton Saree', 'ethnic', 'Saree', 'women', 'Biswa Bangla', 'Free Size', 'good', 'Red', 'Traditional Bengal tant saree, lightly starched. Perfect for Puja.'],
  [8, 'Global Desi Printed Kurti', 'tops', 'Kurti', 'women', 'Global Desi', 'M', 'like_new', 'Purple', 'A-line printed kurti with side pockets.'],
  [8, 'Marks & Spencer Wool Coat', 'jackets', 'Wool coat', 'women', 'Marks & Spencer', 'M', 'good', 'Camel', 'Wool-blend longline coat, fully lined. Dry cleaned.'],
  [9, 'Manyavar Silk Sherwani', 'ethnic', 'Sherwani', 'men', 'Manyavar', 'L', 'like_new', 'Cream', 'Embroidered silk-blend sherwani worn once for a wedding. Includes churidar.'],
  [9, 'Peter England Formal Shirt', 'shirts', 'Formal shirt', 'men', 'Peter England', 'L', 'good', 'White', 'Slim-fit cotton formal shirt. Collar stays included.'],
  [9, 'Bata Leather Loafers', 'footwear', 'Loafers', 'men', 'Bata', 'UK 9', 'good', 'Brown', 'Slip-on leather loafers, resoled recently.'],
  [9, 'Gucci Silk Scarf', 'accessories', 'Scarf', 'unisex', 'Gucci', 'Free Size', 'like_new', 'Multicolour', 'Printed silk twill scarf with original box. Authentic, purchased in Dubai.'],
];

module.exports = { users, listings };
