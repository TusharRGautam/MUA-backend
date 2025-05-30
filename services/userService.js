/**
 * User Service
 * 
 * Provides functions for querying user data from the database
 */

const { query } = require('../db'); // Use the query utility instead of Sequelize models

/**
 * Get user details by email
 * 
 * @param {string} email - User's email address
 * @returns {Promise<Object|null>} - User details or null if not found
 */
const getUserByEmail = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required to fetch user details');
    }
    
    // Query the registration_and_other_details table using direct SQL
    const result = await query(
      'SELECT * FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log(`User not found for email: ${email}`);
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error fetching user by email ${email}:`, error);
    throw error;
  }
};

/**
 * Get user's full name by email
 * 
 * @param {string} email - User's email address
 * @returns {Promise<string|null>} - User's full name or null if not found
 */
const getUserFullNameByEmail = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required to fetch user full name');
    }
    
    // Query to get person_name directly from registration_and_other_details
    const result = await query(
      'SELECT person_name FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log(`User not found for email: ${email}`);
      return null;
    }
    
    return result.rows[0].person_name || '';
  } catch (error) {
    console.error(`Error fetching user's full name by email ${email}:`, error);
    throw error;
  }
};

/**
 * Get vendor details by email
 * 
 * @param {string} email - Vendor's email address
 * @returns {Promise<Object|null>} - Vendor details or null if not found
 */
const getVendorByEmail = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required to fetch vendor details');
    }
    
    // Query the registration_and_other_details table for vendor information
    const result = await query(
      'SELECT * FROM registration_and_other_details WHERE business_email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log(`Vendor not found for email: ${email}`);
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error fetching vendor by email ${email}:`, error);
    throw error;
  }
};

module.exports = {
  getUserByEmail,
  getUserFullNameByEmail,
  getVendorByEmail
}; 