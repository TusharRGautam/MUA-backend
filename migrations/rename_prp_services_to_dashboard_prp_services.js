/**
 * Migration to rename prp_services_from_dashboard_and_app table to dashboard_prp_services
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../db');

async function up() {
  try {
    console.log('Renaming prp_services_from_dashboard_and_app table to dashboard_prp_services...');
    
    // Check if the table exists
    const checkResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'prp_services_from_dashboard_and_app'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('Table prp_services_from_dashboard_and_app does not exist, skipping rename operation.');
      return;
    }
    
    // Execute the SQL migration file
    const sqlFilePath = path.join(__dirname, 'rename_prp_services_to_dashboard_prp_services.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    await query(sqlContent);
    
    console.log('Successfully renamed prp_services_from_dashboard_and_app to dashboard_prp_services');
  } catch (error) {
    console.error('Error renaming prp_services_from_dashboard_and_app table:', error);
    throw error;
  }
}

async function down() {
  try {
    console.log('Reverting rename: changing dashboard_prp_services back to prp_services_from_dashboard_and_app...');
    
    // Check if the renamed table exists
    const checkResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('Table dashboard_prp_services does not exist, skipping revert operation.');
      return;
    }
    
    // Rename the table back
    await query(`
      ALTER TABLE dashboard_prp_services RENAME TO prp_services_from_dashboard_and_app;
    `);
    
    console.log('Successfully reverted rename: dashboard_prp_services back to prp_services_from_dashboard_and_app');
  } catch (error) {
    console.error('Error reverting table rename:', error);
    throw error;
  }
}

module.exports = { up, down };