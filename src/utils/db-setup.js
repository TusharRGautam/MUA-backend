const { supabase } = require('../config/supabase');
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Database setup utility for MUA Application
 * Creates necessary tables if they don't exist
 */

async function setupDatabase() {
  console.log('Starting database setup...');
  
  try {
    // Check if tables exist
    const tablesResult = await db.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    const existingTables = tablesResult.rows.map(row => row.tablename);
    console.log('Existing tables:', existingTables);
    
    // Create salons table if it doesn't exist
    if (!existingTables.includes('salons')) {
      console.log('Creating salons table...');
      
      await db.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TABLE public.salons (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          rating NUMERIC(3,1) DEFAULT 0.0,
          review_count INTEGER DEFAULT 0,
          image TEXT,
          description TEXT,
          phone TEXT,
          email TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          operating_hours JSONB DEFAULT '{"open":"9:00 AM", "close":"6:00 PM", "days":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]}'::jsonb
        );
      `);
      
      console.log('Salons table created successfully');
      
      // Insert sample salon data
      await db.query(`
        INSERT INTO public.salons (name, address, rating, review_count, image, description, phone, email)
        VALUES 
          ('Glamour Salon 1', '123 Beauty Street, Fashion City', 4.8, 124, 'stylist-background.jpg', 'A premium salon offering a wide range of beauty and grooming services with experienced professionals.', '+1 (555) 123-4567', 'contact@glamoursalon1.com'),
          ('Glamour Salon 2', '456 Style Avenue, Beauty Town', 4.6, 98, 'stylist-background.jpg', 'Luxury salon with specialized treatments and premium products.', '+1 (555) 987-6543', 'contact@glamoursalon2.com'),
          ('Glamour Salon 3', '789 Fashion Boulevard, Style City', 4.9, 156, 'stylist-background.jpg', 'Award-winning salon with top stylists and cutting-edge techniques.', '+1 (555) 456-7890', 'contact@glamoursalon3.com');
      `);
      
      console.log('Sample salon data inserted successfully');
    }
    
    // Check for artists table and create if needed
    if (!existingTables.includes('salon_artists')) {
      console.log('Creating salon_artists table...');
      
      await db.query(`
        CREATE TABLE public.salon_artists (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          salon_id UUID REFERENCES public.salons(id),
          full_name TEXT NOT NULL,
          profile_image TEXT,
          specialties JSONB DEFAULT '[]'::jsonb,
          rating NUMERIC(3,1) DEFAULT 0.0,
          experience_years INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('Salon artists table created successfully');
      
      // Get salon IDs
      const salonsResult = await db.query(`SELECT id FROM public.salons`);
      const salons = salonsResult.rows;
      
      if (salons && salons.length > 0) {
        // Insert sample artist data for each salon
        for (const salon of salons) {
          await db.query(`
            INSERT INTO public.salon_artists (salon_id, full_name, profile_image, specialties, rating, experience_years)
            VALUES 
              ('${salon.id}', 'Sarah Johnson', 'stylist-background.jpg', '["Hair Styling", "Coloring"]', 4.9, 8),
              ('${salon.id}', 'Michael Brown', 'stylist-background.jpg', '["Beard Trim", "Men''s Grooming"]', 4.7, 6);
          `);
        }
        
        console.log('Sample artist data inserted successfully');
      }
    }
    
    // Check for salon services table and create if needed
    if (!existingTables.includes('salon_services')) {
      console.log('Creating salon_services table...');
      
      await db.query(`
        CREATE TABLE public.salon_services (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          salon_id UUID REFERENCES public.salons(id),
          name TEXT NOT NULL,
          price NUMERIC(10,2) NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          image TEXT,
          duration INTEGER DEFAULT 30,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('Salon services table created successfully');
      
      // Get salon IDs
      const salonsResult = await db.query(`SELECT id FROM public.salons`);
      const salons = salonsResult.rows;
      
      if (salons && salons.length > 0) {
        // Insert sample service data for each salon
        for (const salon of salons) {
          await db.query(`
            INSERT INTO public.salon_services (salon_id, name, price, description, category, image, duration)
            VALUES 
              ('${salon.id}', 'Haircut & Style', 25.00, 'Expert haircut with professional styling', 'Haircare', 'haircut.jpeg', 45),
              ('${salon.id}', 'Hair Coloring', 55.00, 'Full color transformation with premium products', 'Haircare', 'fullcolor.png', 90),
              ('${salon.id}', 'Beard Trim', 18.00, 'Professional beard grooming and styling', 'Beard Care', 'beardtrim&shave.jpeg', 30),
              ('${salon.id}', 'Facial', 45.00, 'Revitalizing facial treatment for glowing skin', 'Skincare', 'stylist-background.jpg', 60);
          `);
        }
        
        console.log('Sample service data inserted successfully');
      }
    }
    
    // Create SaloneStoreOwner table if it doesn't exist
    if (!existingTables.includes('salonestoreowner')) {
      console.log('Creating SaloneStoreOwner table...');
      
      await db.query(`
        CREATE TABLE IF NOT EXISTS SaloneStoreOwner (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          salonName VARCHAR(255) NOT NULL,
          address TEXT NOT NULL,
          city VARCHAR(100) NOT NULL,
          speciality VARCHAR(255) NOT NULL,
          image_url VARCHAR(255) DEFAULT 'stylist-background.jpg',
          rating DECIMAL(3,2) DEFAULT 4.5,
          distance DECIMAL(3,1) DEFAULT 0.5,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('SaloneStoreOwner table created successfully');
      
      // Insert Mumbai-based salon records
      await db.query(`
        INSERT INTO SaloneStoreOwner (name, salonName, address, city, speciality, rating, distance) VALUES
        ('Anjali Mehta', 'Glamour Touch', 'Shop 12, Link Road, Andheri West', 'Mumbai', 'Bridal Makeup', 4.7, 0.8),
        ('Ritika Shah', 'Bliss Salon', '1st Floor, Infinity Mall, Malad West', 'Mumbai', 'Hair Coloring', 4.9, 1.2),
        ('Priya Nair', 'Style Secrets', 'Opp. High Street Phoenix, Lower Parel', 'Mumbai', 'Facial & Skin Care', 4.6, 1.5),
        ('Rahul Verma', 'Urban Cuts', 'Near Carter Road, Bandra West', 'Mumbai', 'Men''s Hair Styling', 4.8, 0.7),
        ('Sneha Patil', 'Glow Zone', 'IC Colony, Borivali West', 'Mumbai', 'Nail Art', 4.5, 1.8),
        ('Karan Joshi', 'The Hair Lab', 'Powai Plaza, Hiranandani Gardens', 'Mumbai', 'Beard Styling', 4.7, 2.0),
        ('Meera Rao', 'Aura Beauty Lounge', 'Chembur East, Near Ambedkar Garden', 'Mumbai', 'Hair Spa & Smoothening', 4.8, 1.3),
        ('Vikram Desai', 'Chop Shop', 'Opp. Oberoi Mall, Goregaon East', 'Mumbai', 'Men''s Grooming', 4.6, 1.7),
        ('Swati Iyer', 'Pretty Please', '5th Floor, R-City Mall, Ghatkopar West', 'Mumbai', 'Makeup & Hairstyling', 4.9, 0.9),
        ('Ayesha Khan', 'Luxe Beauty Bar', 'Hill Road, Bandra West', 'Mumbai', 'Keratin Treatment', 4.8, 1.0);
      `);
      
      console.log('Mumbai-based salon records inserted successfully');
      
      // Create a trigger to update updated_at timestamp
      await db.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_salon_owner_modified
        BEFORE UPDATE ON SaloneStoreOwner
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);
      
      console.log('Trigger for SaloneStoreOwner created successfully');
    }
    
    // Setup vendor business tables if they don't exist
    if (!existingTables.includes('vendor_business_info')) {
      console.log('Setting up vendor business tables...');
      
      try {
        // Read the SQL migration file
        const sqlFilePath = path.join(__dirname, '../../migrations/vendor_business_tables.sql');
        if (fs.existsSync(sqlFilePath)) {
          const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
          
          // Execute the SQL script
          await db.query(sqlScript);
          
          console.log('Vendor business tables created successfully');
        } else {
          console.error('Vendor business tables migration file not found:', sqlFilePath);
        }
      } catch (error) {
        console.error('Error creating vendor business tables:', error);
      }
    }
    
    console.log('Database setup completed');
    
  } catch (error) {
    console.error('Error in database setup:', error);
    throw error;
  }
}

module.exports = {
  setupDatabase
}; 