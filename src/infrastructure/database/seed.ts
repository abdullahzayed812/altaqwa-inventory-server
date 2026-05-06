import { pool } from "./connection";

async function seed() {
  console.log("Starting database seeding...");

  const conn = await pool.getConnection();

  try {
    // ── Clear all tables ──────────────────────────────────────────────────────
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of [
      "supplier_ledger",
      "supplier_payments",
      "purchase_items",
      "purchases",
      "order_items",
      "orders",
      "payments",
      "drivers",
      "products",
      "suppliers",
      "customers",
    ]) {
      await conn.query(`TRUNCATE TABLE ${table}`);
    }
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    // ── Products (stock starts at 0 — purchases will add, orders will subtract) ─
    await conn.query(`
      INSERT INTO products (name, price, stock) VALUES
        ('يوريا 46%',            850.50, 0),
        ('نترات نشادر 33.5%',    780.00, 0),
        ('سوبر فوسفات',          320.00, 0),
        ('بوتاسيوم سائل',        450.00, 0),
        ('مبيد حشري ديسيس',     120.00, 0),
        ('تقاوي قمح مصر 1',      600.00, 0)
    `);
    // IDs: يوريا=1, نترات=2, سوبر=3, بوتاسيوم=4, مبيد=5, تقاوي=6

    // ── Customers (debt starts at 0 — orders will build it up) ────────────────
    await conn.query(`
      INSERT INTO customers (name, phone, address, totalDebt) VALUES
        ('أحمد محمد علي',            '01012345678', 'المنصورة - الدقهلية',            0),
        ('محمود حسن إبراهيم',        '01198765432', 'طنطا - الغربية',                 0),
        ('الحاج عبد الله سليم',      '01234567890', 'كفر الشيخ',                      0),
        ('شركة النيل للزراعة',       '01555554433', 'القاهرة - طريق مصر إسكندرية',   0)
    `);
    // IDs: أحمد=1, محمود=2, عبدالله=3, النيل=4

    // ── Suppliers (balance starts at 0 — purchases will build it up) ──────────
    await conn.query(`
      INSERT INTO suppliers (name, phone, address, totalBalance) VALUES
        ('شركة أبو قير للأسمدة',              '035600000',  'الإسكندرية', 0),
        ('الشركة المصرية الدولية للكيماويات', '0233445566', 'الجيزة',     0),
        ('مصنع حلوان للأسمدة',               '0223000000', 'حلوان',      0)
    `);
    // IDs: أبو قير=1, المصرية=2, حلوان=3

    // ── Drivers ───────────────────────────────────────────────────────────────
    await conn.query(`
      INSERT INTO drivers (name, phone, vehiclePlate, vehicleDetails, isAvailable) VALUES
        ('سعيد النجار', '0100112233', 'أ ب ج 123', 'جامبو حمراء',      1),
        ('محمد صبري',   '0111445566', 'س ص ع 456', 'تويوتا ربع نقل',   1),
        ('علي فرج',     '0122778899', 'ط ر ل 789', 'مرسيدس أكتروس',   0)
    `);

    // ═════════════════════════════════════════════════════════════════════════
    // PURCHASES  (build supplier balances + add to stock)
    // ═════════════════════════════════════════════════════════════════════════

    // Purchase 1 — أبو قير: يوريا (50×600) + نترات (50×550) = 57,500
    await conn.query(`INSERT INTO purchases (supplierId, totalAmount) VALUES (1, 57500.00)`);
    await conn.query(`
      INSERT INTO purchase_items (purchaseId, productId, quantity, price) VALUES
        (1, 1, 50, 600.00),
        (1, 2, 50, 550.00)
    `);
    await conn.query(`UPDATE products  SET stock        = stock        + 50      WHERE id = 1`);
    await conn.query(`UPDATE products  SET stock        = stock        + 50      WHERE id = 2`);
    await conn.query(`UPDATE suppliers SET totalBalance = totalBalance + 57500   WHERE id = 1`);
    await conn.query(`INSERT INTO supplier_ledger (supplierId, type, amount, referenceId) VALUES (1, 'PURCHASE', 57500.00, 1)`);

    // Purchase 2 — أبو قير: سوبر فوسفات (100×250) = 25,000
    await conn.query(`INSERT INTO purchases (supplierId, totalAmount) VALUES (1, 25000.00)`);
    await conn.query(`INSERT INTO purchase_items (purchaseId, productId, quantity, price) VALUES (2, 3, 100, 250.00)`);
    await conn.query(`UPDATE products  SET stock        = stock        + 100     WHERE id = 3`);
    await conn.query(`UPDATE suppliers SET totalBalance = totalBalance + 25000   WHERE id = 1`);
    await conn.query(`INSERT INTO supplier_ledger (supplierId, type, amount, referenceId) VALUES (1, 'PURCHASE', 25000.00, 2)`);

    // Purchase 3 — المصرية: بوتاسيوم (30×350) + مبيد (100×80) = 18,500
    await conn.query(`INSERT INTO purchases (supplierId, totalAmount) VALUES (2, 18500.00)`);
    await conn.query(`
      INSERT INTO purchase_items (purchaseId, productId, quantity, price) VALUES
        (3, 4, 30, 350.00),
        (3, 5, 100, 80.00)
    `);
    await conn.query(`UPDATE products  SET stock        = stock        + 30      WHERE id = 4`);
    await conn.query(`UPDATE products  SET stock        = stock        + 100     WHERE id = 5`);
    await conn.query(`UPDATE suppliers SET totalBalance = totalBalance + 18500   WHERE id = 2`);
    await conn.query(`INSERT INTO supplier_ledger (supplierId, type, amount, referenceId) VALUES (2, 'PURCHASE', 18500.00, 3)`);

    // Purchase 4 — المصرية: تقاوي قمح (50×400) = 20,000
    await conn.query(`INSERT INTO purchases (supplierId, totalAmount) VALUES (2, 20000.00)`);
    await conn.query(`INSERT INTO purchase_items (purchaseId, productId, quantity, price) VALUES (4, 6, 50, 400.00)`);
    await conn.query(`UPDATE products  SET stock        = stock        + 50      WHERE id = 6`);
    await conn.query(`UPDATE suppliers SET totalBalance = totalBalance + 20000   WHERE id = 2`);
    await conn.query(`INSERT INTO supplier_ledger (supplierId, type, amount, referenceId) VALUES (2, 'PURCHASE', 20000.00, 4)`);

    // ═════════════════════════════════════════════════════════════════════════
    // ORDERS  (build customer debts + subtract from stock)
    // ═════════════════════════════════════════════════════════════════════════

    // Order 1 — أحمد: يوريا (2×850.50) + سوبر فوسفات (3×320) = 2,661  [DELIVERED]
    await conn.query(`INSERT INTO orders (orderNumber, customerId, totalAmount, status) VALUES ('ORD-0001', 1, 2661.00, 'DELIVERED')`);
    await conn.query(`
      INSERT INTO order_items (orderId, productId, quantity, price) VALUES
        (1, 1, 2, 850.50),
        (1, 3, 3, 320.00)
    `);
    await conn.query(`UPDATE products  SET stock     = stock     - 2     WHERE id = 1`);
    await conn.query(`UPDATE products  SET stock     = stock     - 3     WHERE id = 3`);
    await conn.query(`UPDATE customers SET totalDebt = totalDebt + 2661  WHERE id = 1`);

    // Order 2 — أحمد: مبيد (5×120) = 600  [DELIVERED]
    await conn.query(`INSERT INTO orders (orderNumber, customerId, totalAmount, status) VALUES ('ORD-0002', 1, 600.00, 'DELIVERED')`);
    await conn.query(`INSERT INTO order_items (orderId, productId, quantity, price) VALUES (2, 5, 5, 120.00)`);
    await conn.query(`UPDATE products  SET stock     = stock     - 5    WHERE id = 5`);
    await conn.query(`UPDATE customers SET totalDebt = totalDebt + 600  WHERE id = 1`);

    // Order 3 — عبدالله: يوريا (10×850.50) + نترات (5×780) = 12,405  [PENDING]
    await conn.query(`INSERT INTO orders (orderNumber, customerId, totalAmount, status) VALUES ('ORD-0003', 3, 12405.00, 'PENDING')`);
    await conn.query(`
      INSERT INTO order_items (orderId, productId, quantity, price) VALUES
        (3, 1, 10, 850.50),
        (3, 2,  5, 780.00)
    `);
    await conn.query(`UPDATE products  SET stock     = stock     - 10     WHERE id = 1`);
    await conn.query(`UPDATE products  SET stock     = stock     - 5      WHERE id = 2`);
    await conn.query(`UPDATE customers SET totalDebt = totalDebt + 12405  WHERE id = 3`);

    // Order 4 — عبدالله: تقاوي قمح (15×600) = 9,000  [PENDING]
    await conn.query(`INSERT INTO orders (orderNumber, customerId, totalAmount, status) VALUES ('ORD-0004', 3, 9000.00, 'PENDING')`);
    await conn.query(`INSERT INTO order_items (orderId, productId, quantity, price) VALUES (4, 6, 15, 600.00)`);
    await conn.query(`UPDATE products  SET stock     = stock     - 15    WHERE id = 6`);
    await conn.query(`UPDATE customers SET totalDebt = totalDebt + 9000  WHERE id = 3`);

    // Order 5 — النيل: بوتاسيوم (5×450) = 2,250  [PENDING]
    await conn.query(`INSERT INTO orders (orderNumber, customerId, totalAmount, status) VALUES ('ORD-0005', 4, 2250.00, 'PENDING')`);
    await conn.query(`INSERT INTO order_items (orderId, productId, quantity, price) VALUES (5, 4, 5, 450.00)`);
    await conn.query(`UPDATE products  SET stock     = stock     - 5     WHERE id = 4`);
    await conn.query(`UPDATE customers SET totalDebt = totalDebt + 2250  WHERE id = 4`);

    // ═════════════════════════════════════════════════════════════════════════
    // CUSTOMER PAYMENTS  (reduce debts)
    // ═════════════════════════════════════════════════════════════════════════

    // أحمد pays 1,000 cash  →  debt: 3,261 − 1,000 = 2,261
    await conn.query(`INSERT INTO payments (customerId, amount, method, notes) VALUES (1, 1000.00, 'CASH', 'دفعة جزئية')`);
    await conn.query(`UPDATE customers SET totalDebt = totalDebt - 1000 WHERE id = 1`);

    // عبدالله pays 5,000 bank  →  debt: 21,405 − 5,000 = 16,405
    await conn.query(`INSERT INTO payments (customerId, amount, method, notes) VALUES (3, 5000.00, 'BANK', 'تحويل بنكي')`);
    await conn.query(`UPDATE customers SET totalDebt = totalDebt - 5000 WHERE id = 3`);

    // ═════════════════════════════════════════════════════════════════════════
    // SUPPLIER PAYMENTS  (reduce balances)
    // ═════════════════════════════════════════════════════════════════════════

    // Pay أبو قير 50,000  →  balance: 82,500 − 50,000 = 32,500
    await conn.query(`INSERT INTO supplier_payments (supplierId, amount, note) VALUES (1, 50000.00, 'دفعة جزئية للمورد')`);
    await conn.query(`UPDATE suppliers SET totalBalance = totalBalance - 50000 WHERE id = 1`);
    await conn.query(`INSERT INTO supplier_ledger (supplierId, type, amount, referenceId) VALUES (1, 'PAYMENT', 50000.00, 1)`);

    // ─────────────────────────────────────────────────────────────────────────
    // Print summary
    // ─────────────────────────────────────────────────────────────────────────
    const [[{ products }]]  = await conn.query(`SELECT COUNT(*) AS products  FROM products`)  as any[];
    const [[{ customers }]] = await conn.query(`SELECT COUNT(*) AS customers FROM customers`) as any[];
    const [[{ suppliers }]] = await conn.query(`SELECT COUNT(*) AS suppliers FROM suppliers`) as any[];
    const [[{ drivers }]]   = await conn.query(`SELECT COUNT(*) AS drivers   FROM drivers`)   as any[];
    const [[{ orders }]]    = await conn.query(`SELECT COUNT(*) AS orders    FROM orders`)    as any[];
    const [[{ purchases }]] = await conn.query(`SELECT COUNT(*) AS purchases FROM purchases`) as any[];
    const [[{ payments }]]  = await conn.query(`SELECT COUNT(*) AS payments  FROM payments`)  as any[];

    console.log('');
    console.log(`📦 ${products}  products`);
    console.log(`👥 ${customers} customers`);
    console.log(`🏭 ${suppliers} suppliers`);
    console.log(`🚗 ${drivers}   drivers`);
    console.log(`🛒 ${orders}    orders`);
    console.log(`🧾 ${purchases} purchases`);
    console.log(`💰 ${payments}  payments`);
    console.log('');
    console.log('✅ Seeding completed.');
  } catch (err) {
    console.error("Seeding failed:", err);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
