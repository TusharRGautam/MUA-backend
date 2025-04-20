const { supabase } = require('../config/supabase');
const db = require('../config/database');

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
    
    console.log('Database setup completed');
    
  } catch (error) {
    console.error('Error in database setup:', error);
    throw error;
  }
}

module.exports = {
  setupDatabase
}; 