/**
 * Script to check if dashboard service tables exist
 */

const { query } = require('./db');

async function checkTables() {
  try {
    console.log('Checking dashboard service tables...');
    
    // Check if dashboard_salon_services table exists
    const salonTableResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_salon_services'
      );
    `);
    
    console.log('dashboard_salon_services exists:', salonTableResult.rows[0].exists);
    
    // Check if dashboard_prp_services table exists
    const prpTableResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
      );
    `);
    
    console.log('dashboard_prp_services exists:', prpTableResult.rows[0].exists);
    
    // Check if dashboard_diagnostics_services table exists
    const diagnosticsTableResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_diagnostics_services'
      );
    `);
    
    console.log('dashboard_diagnostics_services exists:', diagnosticsTableResult.rows[0].exists);
    
    // If dashboard_prp_services doesn't exist, check if package_services_from_dashboard exists
    if (!prpTableResult.rows[0].exists) {
      const packageTableResult = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'package_services_from_dashboard'
        );
      `);
      
      console.log('package_services_from_dashboard exists:', packageTableResult.rows[0].exists);
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

// Run the function
checkTables().catch(console.error);