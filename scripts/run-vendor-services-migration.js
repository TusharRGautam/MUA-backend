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

const insertVendorServices = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Insert services for vendor_id 22
    const services = [
      {
        vendor_id: 22,
        name: 'Classic Precision Cut',
        type: 'Haircut',
        description: 'Professional haircut tailored to your face shape and style preferences. Includes consultation, wash, cut, and styling.',
        price: '₹450',
        duration: '45 min'
      },
      {
        vendor_id: 22,
        name: 'Gel Manicure',
        type: 'Nail',
        description: 'Long-lasting gel polish application with cuticle care, nail shaping, and hand massage. Chip-resistant finish for up to 2 weeks.',
        price: '₹800',
        duration: '60 min'
      },
      {
        vendor_id: 22,
        name: 'Deep Cleansing Facial',
        type: 'Facial',
        description: 'Thorough facial treatment to remove impurities and dead skin cells. Includes cleansing, exfoliation, extraction, and hydrating mask.',
        price: '₹1200',
        duration: '75 min'
      },
      {
        vendor_id: 22,
        name: 'Hydrating Skin Treatment',
        type: 'Skin Care',
        description: 'Intensive moisture therapy for dry or dehydrated skin. Restores skin\'s natural barrier with hyaluronic acid and essential nutrients.',
        price: '₹1500',
        duration: '90 min'
      },
      {
        vendor_id: 22,
        name: 'Global Hair Color',
        type: 'Coloring',
        description: 'Full hair color application with premium ammonia-free dyes. Includes consultation, application, processing, wash, and blow-dry styling.',
        price: '₹2200',
        duration: '120 min'
      },
      {
        vendor_id: 22,
        name: 'Full Leg Waxing',
        type: 'Waxing',
        description: 'Smooth and thorough hair removal for the entire leg using premium wax. Leaves skin soft with longer-lasting results than shaving.',
        price: '₹900',
        duration: '45 min'
      },
      {
        vendor_id: 22,
        name: 'Bridal Mehendi Design',
        type: 'Mehendi',
        description: 'Elaborate traditional mehendi application for brides. Intricate designs for hands and feet with premium quality henna and aftercare.',
        price: '₹3500',
        duration: '180 min'
      }
    ];

    for (const service of services) {
      await client.query(
        `INSERT INTO vendor_single_services 
        (vendor_id, name, type, description, price, duration)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          service.vendor_id,
          service.name,
          service.type,
          service.description,
          service.price,
          service.duration
        ]
      );
    }

    await client.query('COMMIT');
    console.log('Successfully inserted vendor services for vendor_id 22');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting vendor services:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

insertVendorServices().catch(console.error); 