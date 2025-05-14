const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const vendorId = 22;

const combos = [
  {
    combo_name: 'Hair & Nail Combo',
    combo_description: 'Perfect combination of hair styling and nail care for a complete look.',
    combo_price: 1100.00,
    combo_duration: 105, // 45 min haircut + 60 min manicure
    services: [
      'Classic Precision Cut',
      'Gel Manicure'
    ]
  },
  {
    combo_name: 'Skin & Wax Combo',
    combo_description: 'Deep cleansing facial followed by smooth waxing for radiant skin.',
    combo_price: 1900.00,
    combo_duration: 120, // 75 min facial + 45 min waxing
    services: [
      'Deep Cleansing Facial',
      'Full Leg Waxing'
    ]
  },
  {
    combo_name: 'Color & Care Combo',
    combo_description: 'Transform your hair color while giving your skin the hydration it needs.',
    combo_price: 3400.00,
    combo_duration: 210, // 120 min color + 90 min treatment
    services: [
      'Global Hair Color',
      'Hydrating Skin Treatment'
    ]
  },
  {
    combo_name: 'Bridal Prep Combo',
    combo_description: 'Essential bridal preparation with mehendi and skin treatment.',
    combo_price: 4700.00,
    combo_duration: 270, // 180 min mehendi + 90 min treatment
    services: [
      'Bridal Mehendi Design',
      'Hydrating Skin Treatment'
    ]
  },
  {
    combo_name: 'Beauty & Grooming Combo',
    combo_description: 'Complete beauty package with facial and waxing services.',
    combo_price: 2000.00,
    combo_duration: 120, // 75 min facial + 45 min waxing
    services: [
      'Deep Cleansing Facial',
      'Full Leg Waxing'
    ]
  }
];

const run = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get all services for vendor 22
    const { rows: allServices } = await client.query(
      'SELECT * FROM vendor_single_services WHERE vendor_id = $1',
      [vendorId]
    );
    const serviceMap = {};
    allServices.forEach(s => { serviceMap[s.name] = s; });

    for (const combo of combos) {
      // Insert combo
      const comboRes = await client.query(
        `INSERT INTO vendor_combo_services (
          vendor_id, combo_name, combo_description, combo_price, combo_duration
        ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [vendorId, combo.combo_name, combo.combo_description, combo.combo_price, combo.combo_duration]
      );
      const comboId = comboRes.rows[0].id;

      // Insert each service in the combo
      for (const serviceName of combo.services) {
        const svc = serviceMap[serviceName];
        if (!svc) throw new Error(`Service not found: ${serviceName}`);
        // Convert service price from string (₹XXX) to numeric
        const servicePrice = parseFloat(svc.price.replace('₹', ''));
        await client.query(
          `INSERT INTO combo_services (
            combo_id, name, price, category, description, vendor_id
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [comboId, svc.name, servicePrice, svc.type, svc.description, vendorId]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Successfully inserted combo services for vendor_id 22');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inserting combo services:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch(console.error); 