import { pool } from './connection';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Clear existing data (in reverse order of foreign keys)
    console.log('🧹 Cleaning existing data...');
    await pool.query('DELETE FROM supplier_ledger');
    await pool.query('DELETE FROM supplier_payments');
    await pool.query('DELETE FROM purchase_items');
    await pool.query('DELETE FROM purchases');
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM payments');
    await pool.query('DELETE FROM drivers');
    await pool.query('DELETE FROM products');
    await pool.query('DELETE FROM suppliers');
    await pool.query('DELETE FROM customers');

    // 2. Seed Products
    console.log('📦 Seeding products...');
    const products = [
      ['يوريا 46%', 850.50, 100],
      ['نترات نشادر 33.5%', 780.00, 150],
      ['سوبر فوسفات', 320.00, 200],
      ['بوتاسيوم سائل', 450.00, 50],
      ['مبيد حشري ديسيس', 120.00, 300],
      ['تقاوي قمح مصر 1', 600.00, 80],
    ];
    await pool.query('INSERT INTO products (name, price, stock) VALUES ?', [products]);

    // 3. Seed Customers
    console.log('👥 Seeding customers...');
    const customers = [
      ['أحمد محمد علي', '01012345678', 'المنصورة - الدقهلية', 1500.00],
      ['محمود حسن إبراهيم', '01198765432', 'طنطا - الغربية', 0.00],
      ['الحاج عبد الله سليم', '01234567890', 'كفر الشيخ', 24500.50],
      ['شركة النيل للزراعة', '01555554433', 'القاهرة - طريق مصر إسكندرية', 5000.00],
    ];
    await pool.query('INSERT INTO customers (name, phone, address, totalDebt) VALUES ?', [customers]);

    // 4. Seed Suppliers
    console.log('🏭 Seeding suppliers...');
    const suppliers = [
      ['شركة أبو قير للأسمدة', '035600000', 'الإسكندرية', -150000.00],
      ['الشركة المصرية الدولية للكيماويات', '0233445566', 'الجيزة', -50000.00],
      ['مصنع حلوان للأسمدة', '0223000000', 'حلوان', 0.00],
    ];
    await pool.query('INSERT INTO suppliers (name, phone, address, totalBalance) VALUES ?', [suppliers]);

    // 5. Seed Drivers
    console.log('🚗 Seeding drivers...');
    const drivers = [
      ['سعيد النجار', '0100112233', 'أ ب ج 123', 'جامبو حمراء', 1],
      ['محمد صبري', '0111445566', 'س ص ع 456', 'تويوتا ربع نقل', 1],
      ['علي فرج', '0122778899', 'ط ر ل 789', 'مرسيدس أكتروس', 0],
    ];
    await pool.query('INSERT INTO drivers (name, phone, vehiclePlate, vehicleDetails, isAvailable) VALUES ?', [drivers]);

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seed();
