/**
 * Migration to rename dashboard_prp_services table back to package_services_from_dashboard
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../db');

async function up() {
  try {
    console.log('Renaming dashboard_prp_services table back to package_services_from_dashboard...');
    
    // Check if the table exists
    const checkResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('Table dashboard_prp_services does not exist, skipping rename operation.');
      return;
    }
    
    // Execute the SQL migration file
    const sqlFilePath = path.join(__dirname, 'rename_dashboard_prp_services_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    await query(sqlContent);
    
    console.log('Successfully renamed dashboard_prp_services back to package_services_from_dashboard');
  } catch (error) {
    console.error('Error renaming dashboard_prp_services table:', error);
    throw error;
  }
}

async function down() {
  try {
    console.log('Reverting rename: changing package_services_from_dashboard back to dashboard_prp_services...');
    
    // Check if the renamed table exists
    const checkResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'package_services_from_dashboard'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('Table package_services_from_dashboard does not exist, skipping revert operation.');
      return;
    }
    
    // Rename the table back
    await query(`ALTER TABLE package_services_from_dashboard RENAME TO dashboard_prp_services;`);
    
    console.log('Successfully reverted rename: changed package_services_from_dashboard back to dashboard_prp_services');
  } catch (error) {
    console.error('Error reverting table rename:', error);
    throw error;
  }
}

module.exports = { up, down };