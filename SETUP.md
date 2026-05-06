# Setup Guide

## Backend (server/)

### Requirements
- Node.js 18+
- MySQL 8+

### Steps

```bash
cd server
npm install

# Edit .env with your MySQL credentials
cp .env.example .env
nano .env

# Start dev server (auto-creates all tables on first run)
npm run dev
```

The server runs on `http://localhost:3000`.  
All tables are auto-created from `schema.sql` on startup.

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/customers | List customers |
| POST | /api/customers | Add customer |
| GET | /api/products | List products |
| POST | /api/products | Add product |
| PATCH | /api/products/:id/stock | Update stock |
| GET | /api/orders | List orders (with relations) |
| POST | /api/orders | Create order (reduces stock + adds debt) |
| PATCH | /api/orders/:id/status | Update status (CANCELLED restores stock+debt) |
| PATCH | /api/orders/:id/assign-driver | Assign driver |
| GET | /api/payments | List customer payments |
| POST | /api/payments | Add payment (reduces customer debt) |
| GET | /api/suppliers | List suppliers |
| POST | /api/suppliers | Add supplier |
| POST | /api/purchases | Create purchase (increases stock + supplier balance) |
| POST | /api/suppliers/:id/payments | Add supplier payment (reduces supplier balance) |
| GET | /api/suppliers/:id/ledger | Supplier ledger entries |
| GET | /api/suppliers/payments/all | All supplier payments |
| GET | /api/suppliers/purchases/all | All purchases |
| GET | /api/drivers | List drivers |
| POST | /api/drivers | Add driver |
| PATCH | /api/drivers/:id/availability | Toggle availability |
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/reports | Sales & balance report |

---

## Mobile App (mobile/)

### Requirements
- React Native CLI environment (Android Studio / Xcode)
- Node.js 18+

### Steps

```bash
# Initialize the React Native project
cd mobile
npx react-native init AgricultureInventory --skip-install
# Then copy the src/ files from this directory into AgricultureInventory/

# OR: directly install deps in this mobile/ folder if already initialized
npm install

# For Android emulator - server runs on 10.0.2.2:3000 (default)
# For real device - change BASE_URL in src/api/client.ts to your machine's IP

# Run on Android
npm run android

# Run on iOS
cd ios && pod install && cd ..
npm run ios
```

### Screens
| Screen | Maps To | Notes |
|--------|---------|-------|
| Dashboard | DashboardUseCases.getStats() | 4 stat cards + top products |
| Customers | CustomerUseCases | Search, card list, FAB to add |
| Customer Details | Orders + Payments filtered | Ledger view + Add Payment |
| Suppliers | SupplierUseCases | Search, card list, FAB to add |
| Supplier Details | getLedger() | Balance, purchase+payment actions |
| Products | InventoryUseCases | 2-column grid, low stock highlighted |
| Orders | OrderUseCases | Filter by status, inline status change |
| Create Order | createOrder() | Select customer + cart with stock check |
| Purchases | getAllPurchases() | Read-only list |
| Add Purchase | createPurchase() | Supplier details → purchase form |
| Payments | PaymentUseCases | Customer payment list |
| Add Payment | addPayment() | Customer + amount + method |
| Drivers | DriverUseCases | Toggle availability |
| Reports | ReportUseCases | Sales summary + customer balances |

### Business Logic Mapping
All logic lives in the **server**. The mobile is pure presentation:
- Stock validation happens server-side (same rule: error if stock < quantity)
- Customer debt updated server-side (same formula: debt += order, debt -= payment)
- Supplier balance updated server-side (same formula: balance += purchase, balance -= payment)
- Ledger entries created server-side (same PURCHASE/PAYMENT types)
- Order cancellation restores stock and debt server-side (same logic)
