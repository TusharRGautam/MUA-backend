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
    combo_service_name1: 'Hair & Nail Combo',
    combo_service_name2: 'Style & Care',
    combo_description: 'Perfect combination of hair styling and nail care for a complete look.',
    combo_price: 1100.00,
    combo_duration: 105, // 45 min haircut + 60 min manicure
    what_includes: 'Hair styling, washing, blow dry, nail cleaning, filing, polish application',
    discount: 200.00,
    services: [
      'Classic Precision Cut',
      'Gel Manicure'
    ]
  },
  {
    combo_service_name1: 'Skin & Wax Combo',
    combo_service_name2: 'Smooth & Glow',
    combo_description: 'Deep cleansing facial followed by smooth waxing for radiant skin.',
    combo_price: 1900.00,
    combo_duration: 120, // 75 min facial + 45 min waxing
    what_includes: 'Facial cleansing, scrub, mask, waxing preparation, waxing, soothing treatment',
    discount: 300.00,
    services: [
      'Deep Cleansing Facial',
      'Full Leg Waxing'
    ]
  },
  {
    combo_service_name1: 'Color & Care Combo',
    combo_service_name2: 'Transform & Hydrate',
    combo_description: 'Transform your hair color while giving your skin the hydration it needs.',
    combo_price: 3400.00,
    combo_duration: 210, // 120 min color + 90 min treatment
    what_includes: 'Color consultation, application, processing, washing, hydrating treatment, mask',
    discount: 500.00,
    services: [
      'Global Hair Color',
      'Hydrating Skin Treatment'
    ]
  },
  {
    combo_service_name1: 'Bridal Prep Combo',
    combo_service_name2: 'Wedding Ready',
    combo_description: 'Essential bridal preparation with mehendi and skin treatment.',
    combo_price: 4700.00,
    combo_duration: 270, // 180 min mehendi + 90 min treatment
    what_includes: 'Mehendi design consultation, application, drying time, skin cleansing, treatment, mask',
    discount: 800.00,
    services: [
      'Bridal Mehendi Design',
      'Hydrating Skin Treatment'
    ]
  },
  {
    combo_service_name1: 'Beauty & Grooming Combo',
    combo_service_name2: 'Complete Pamper',
    combo_description: 'Complete beauty package with facial and waxing services.',
    combo_price: 2000.00,
    combo_duration: 120, // 75 min facial + 45 min waxing
    what_includes: 'Deep cleansing, exfoliation, extraction, mask, waxing preparation, waxing',
    discount: 350.00,
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
          vendor_id, combo_service_name1, combo_service_name2, combo_description, combo_price, combo_duration, what_includes, discount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [vendorId, combo.combo_service_name1, combo.combo_service_name2, combo.combo_description, combo.combo_price, combo.combo_duration, combo.what_includes, combo.discount]
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