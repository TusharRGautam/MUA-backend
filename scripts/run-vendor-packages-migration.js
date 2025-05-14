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

const packages = [
  {
    name: 'Glow & Groom Package',
    description: 'A complete grooming and glow-up experience including haircut, facial, and waxing.',
    price: '₹2400',
    services: [
      'Classic Precision Cut',
      'Deep Cleansing Facial',
      'Full Leg Waxing',
    ],
  },
  {
    name: 'Bridal Essentials',
    description: 'Essential bridal services for your big day: mehendi, manicure, and skin hydration.',
    price: '₹5200',
    services: [
      'Bridal Mehendi Design',
      'Gel Manicure',
      'Hydrating Skin Treatment',
    ],
  },
  {
    name: 'Color & Care Combo',
    description: 'Transform your look with global hair color and a hydrating skin treatment.',
    price: '₹3400',
    services: [
      'Global Hair Color',
      'Hydrating Skin Treatment',
    ],
  },
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

    for (const pkg of packages) {
      // Insert package
      const pkgRes = await client.query(
        `INSERT INTO vendor_packages_services (vendor_id, name, price, description) VALUES ($1, $2, $3, $4) RETURNING id`,
        [vendorId, pkg.name, pkg.price, pkg.description]
      );
      const packageId = pkgRes.rows[0].id;

      // Insert each service in the package
      for (const serviceName of pkg.services) {
        const svc = serviceMap[serviceName];
        if (!svc) throw new Error(`Service not found: ${serviceName}`);
        await client.query(
          `INSERT INTO package_services (package_id, name, price, category, description, vendor_id) VALUES ($1, $2, $3, $4, $5, $6)`,
          [packageId, svc.name, svc.price, svc.type, svc.description, vendorId]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Successfully inserted packages and package services for vendor_id 22');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inserting packages:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch(console.error); 