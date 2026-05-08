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

    // ── Products (stock starts at 100) ──────────────────────────────────────────
    await conn.query(`
      INSERT INTO products (name, price, stock) VALUES
        ('كبريتات معبأ', ${Math.floor(Math.random() * 500) + 100}, 100),
        ('كبريتات سب', ${Math.floor(Math.random() * 500) + 100}, 100),
        ('يوريا أبو قير أزرق', ${Math.floor(Math.random() * 500) + 100}, 100),
        ('يوريا أبو قير مخصوص', ${Math.floor(Math.random() * 500) + 100}, 100),
        ('سوبر كفر الزيات ناعم', ${Math.floor(Math.random() * 500) + 100}, 100),
        ('سوبر كفر الزيات محبب', ${Math.floor(Math.random() * 500) + 100}, 100),
        ('ملح متور ناعم', ${Math.floor(Math.random() * 500) + 100}, 100),
        ('ملح مستور محبب', ${Math.floor(Math.random() * 500) + 100}, 100),
        ('حديدوز', ${Math.floor(Math.random() * 500) + 100}, 100),
        ('نترات ابو قي', ${Math.floor(Math.random() * 500) + 100}, 100),
        ('ماب', ${Math.floor(Math.random() * 500) + 100}, 100),
        ('صيموميك', ${Math.floor(Math.random() * 500) + 100}, 100),
        ('تقاوي ذرة', ${Math.floor(Math.random() * 500) + 100}, 100)
    `);

    // ── Suppliers (balance starts at 0) ───────────────────────────────────────
    await conn.query(`
      INSERT INTO suppliers (name, phone, address, totalBalance) VALUES
        ('الشركة الدولية للاسمدة', '', '', 0),
        ('الشركة الدولية للمحاصيل', '', '', 0)
    `);

    // ── Drivers ───────────────────────────────────────────────────────────────
    await conn.query(`
      INSERT INTO drivers (name, phone, vehiclePlate, vehicleDetails, isAvailable) VALUES
        ('سعيد النجار', '0100112233', 'أ ب ج 123', 'جامبو حمراء',      1),
        ('محمد صبري',   '0111445566', 'س ص ع 456', 'تويوتا ربع نقل',   1),
        ('علي فرج',     '0122778899', 'ط ر ل 789', 'مرسيدس أكتروس',   0)
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // Print summary
    // ─────────────────────────────────────────────────────────────────────────
    const [[{ products }]] = await conn.query(`SELECT COUNT(*) AS products  FROM products`) as any[];
    const [[{ suppliers }]] = await conn.query(`SELECT COUNT(*) AS suppliers FROM suppliers`) as any[];
    const [[{ drivers }]] = await conn.query(`SELECT COUNT(*) AS drivers   FROM drivers`) as any[];

    console.log('');
    console.log(`📦 ${products}  products`);
    console.log(`🏭 ${suppliers} suppliers`);
    console.log(`🚗 ${drivers}   drivers`);
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
