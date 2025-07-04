const { query } = require('../db');

// Salon Services Controllers
exports.getSalonServices = async (req, res) => {
  try {
    const results = await query('SELECT * FROM dashboard_salon_services ORDER BY service_name');
    res.status(200).json({
      success: true,
      count: results.rows.length,
      data: results.rows
    });
  } catch (error) {
    console.error('Error fetching salon services:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

exports.getSalonService = async (req, res) => {
  try {
    const { id } = req.params;
    const results = await query('SELECT * FROM dashboard_salon_services WHERE id = $1', [id]);
    
    if (results.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Salon service not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: results.rows[0]
    });
  } catch (error) {
    console.error('Error fetching salon service:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

exports.createSalonService = async (req, res) => {
  try {
    const { 
      service_name,
      service_categories,
      price,
      duration,
      description,
      things_to_know,
      what_packages_include,
      precautions,
      products_used,
      before_and_after_image,
      gallery_image,
      service_image
    } = req.body;

    if (!service_name) {
      return res.status(400).json({
        success: false,
        error: 'Service name is required'
      });
    }

    const results = await query(
      `INSERT INTO dashboard_salon_services 
      (service_name, service_categories, price, duration, description, 
      things_to_know, what_packages_include, precautions, products_used, 
      before_and_after_image, gallery_image, service_image) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        service_name,
        service_categories,
        price,
        duration,
        description,
        things_to_know,
        what_packages_include,
        precautions,
        products_used,
        before_and_after_image,
        gallery_image,
        service_image
      ]
    );

    res.status(201).json({
      success: true,
      data: results.rows[0]
    });
  } catch (error) {
    console.error('Error creating salon service:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

exports.updateSalonService = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      service_name,
      service_categories,
      price,
      duration,
      description,
      things_to_know,
      what_packages_include,
      precautions,
      products_used,
      before_and_after_image,
      gallery_image,
      service_image
    } = req.body;

    if (!service_name) {
      return res.status(400).json({
        success: false,
        error: 'Service name is required'
      });
    }

    // Check if service exists
    const checkResults = await query('SELECT * FROM dashboard_salon_services WHERE id = $1', [id]);
    
    if (checkResults.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Salon service not found'
      });
    }

    const results = await query(
      `UPDATE dashboard_salon_services SET 
      service_name = $1, 
      service_categories = $2, 
      price = $3, 
      duration = $4, 
      description = $5, 
      things_to_know = $6, 
      what_packages_include = $7, 
      precautions = $8, 
      products_used = $9, 
      before_and_after_image = $10, 
      gallery_image = $11, 
      service_image = $12
      WHERE id = $13 RETURNING *`,
      [
        service_name,
        service_categories,
        price,
        duration,
        description,
        things_to_know,
        what_packages_include,
        precautions,
        products_used,
        before_and_after_image,
        gallery_image,
        service_image,
        id
      ]
    );

    res.status(200).json({
      success: true,
      data: results.rows[0]
    });
  } catch (error) {
    console.error('Error updating salon service:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

exports.deleteSalonService = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const checkResults = await query('SELECT * FROM dashboard_salon_services WHERE id = $1', [id]);
    
    if (checkResults.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Salon service not found'
      });
    }

    await query('DELETE FROM dashboard_salon_services WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting salon service:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// PRP Services Controllers
exports.getPrpServices = async (req, res) => {
  try {
    const results = await query('SELECT * FROM dashboard_prp_services ORDER BY service_name');
    res.status(200).json({
      success: true,
      count: results.rows.length,
      data: results.rows
    });
  } catch (error) {
    console.error('Error fetching PRP services:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

exports.getPrpService = async (req, res) => {
  try {
    const { id } = req.params;
    const results = await query('SELECT * FROM dashboard_prp_services WHERE id = $1', [id]);
    
    if (results.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PRP service not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: results.rows[0]
    });
  } catch (error) {
    console.error('Error fetching PRP service:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

exports.createPrpService = async (req, res) => {
  try {
    const { 
      service_name,
      service_categories,
      price,
      duration,
      description,
      things_to_know,
      what_packages_include,
      precautions,
      products_used,
      before_and_after_image,
      gallery_image,
      service_image
    } = req.body;

    if (!service_name) {
      return res.status(400).json({
        success: false,
        error: 'Service name is required'
      });
    }

    const results = await query(
      `INSERT INTO dashboard_prp_services 
      (service_name, service_categories, price, duration, description, 
      things_to_know, what_packages_include, precautions, products_used, 
      before_and_after_image, gallery_image, service_image) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        service_name,
        service_categories,
        price,
        duration,
        description,
        things_to_know,
        what_packages_include,
        precautions,
        products_used,
        before_and_after_image,
        gallery_image,
        service_image
      ]
    );

    res.status(201).json({
      success: true,
      data: results.rows[0]
    });
  } catch (error) {
    console.error('Error creating PRP service:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

exports.updatePrpService = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      service_name,
      service_categories,
      price,
      duration,
      description,
      things_to_know,
      what_packages_include,
      precautions,
      products_used,
      before_and_after_image,
      gallery_image,
      service_image
    } = req.body;

    if (!service_name) {
      return res.status(400).json({
        success: false,
        error: 'Service name is required'
      });
    }

    // Check if service exists
    const checkResults = await query('SELECT * FROM dashboard_prp_services WHERE id = $1', [id]);
    
    if (checkResults.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PRP service not found'
      });
    }

    const results = await query(
      `UPDATE dashboard_prp_services SET 
      service_name = $1, 
      service_categories = $2, 
      price = $3, 
      duration = $4, 
      description = $5, 
      things_to_know = $6, 
      what_packages_include = $7, 
      precautions = $8, 
      products_used = $9, 
      before_and_after_image = $10, 
      gallery_image = $11, 
      service_image = $12
      WHERE id = $13 RETURNING *`,
      [
        service_name,
        service_categories,
        price,
        duration,
        description,
        things_to_know,
        what_packages_include,
        precautions,
        products_used,
        before_and_after_image,
        gallery_image,
        service_image,
        id
      ]
    );

    res.status(200).json({
      success: true,
      data: results.rows[0]
    });
  } catch (error) {
    console.error('Error updating PRP service:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

exports.deletePrpService = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const checkResults = await query('SELECT * FROM dashboard_prp_services WHERE id = $1', [id]);
    
    if (checkResults.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PRP service not found'
      });
    }

    await query('DELETE FROM dashboard_prp_services WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting PRP service:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Diagnostics Services Controllers
exports.getDiagnosticsServices = async (req, res) => {
  try {
    const results = await query('SELECT * FROM dashboard_diagnostics_services ORDER BY service_name');
    res.status(200).json({
      success: true,
      count: results.rows.length,
      data: results.rows
    });
  } catch (error) {
    console.error('Error fetching diagnostics services:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

exports.getDiagnosticsService = async (req, res) => {
  try {
    const { id } = req.params;
    const results = await query('SELECT * FROM dashboard_diagnostics_services WHERE id = $1', [id]);
    
    if (results.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Diagnostics service not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: results.rows[0]
    });
  } catch (error) {
    console.error('Error fetching diagnostics service:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

exports.createDiagnosticsService = async (req, res) => {
  try {
    const { 
      service_name,
      service_categories,
      price,
      duration,
      description,
      things_to_know,
      what_packages_include,
      precautions,
      products_used,
      before_and_after_image,
      gallery_image,
      service_image
    } = req.body;

    if (!service_name) {
      return res.status(400).json({
        success: false,
        error: 'Service name is required'
      });
    }

    const results = await query(
      `INSERT INTO dashboard_diagnostics_services 
      (service_name, service_categories, price, duration, description, 
      things_to_know, what_packages_include, precautions, products_used, 
      before_and_after_image, gallery_image, service_image) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        service_name,
        service_categories,
        price,
        duration,
        description,
        things_to_know,
        what_packages_include,
        precautions,
        products_used,
        before_and_after_image,
        gallery_image,
        service_image
      ]
    );

    res.status(201).json({
      success: true,
      data: results.rows[0]
    });
  } catch (error) {
    console.error('Error creating diagnostics service:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

exports.updateDiagnosticsService = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      service_name,
      service_categories,
      price,
      duration,
      description,
      things_to_know,
      what_packages_include,
      precautions,
      products_used,
      before_and_after_image,
      gallery_image,
      service_image
    } = req.body;

    if (!service_name) {
      return res.status(400).json({
        success: false,
        error: 'Service name is required'
      });
    }

    // Check if service exists
    const checkResults = await query('SELECT * FROM dashboard_diagnostics_services WHERE id = $1', [id]);
    
    if (checkResults.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Diagnostics service not found'
      });
    }

    const results = await query(
      `UPDATE dashboard_diagnostics_services SET 
      service_name = $1, 
      service_categories = $2, 
      price = $3, 
      duration = $4, 
      description = $5, 
      things_to_know = $6, 
      what_packages_include = $7, 
      precautions = $8, 
      products_used = $9, 
      before_and_after_image = $10, 
      gallery_image = $11, 
      service_image = $12
      WHERE id = $13 RETURNING *`,
      [
        service_name,
        service_categories,
        price,
        duration,
        description,
        things_to_know,
        what_packages_include,
        precautions,
        products_used,
        before_and_after_image,
        gallery_image,
        service_image,
        id
      ]
    );

    res.status(200).json({
      success: true,
      data: results.rows[0]
    });
  } catch (error) {
    console.error('Error updating diagnostics service:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

exports.deleteDiagnosticsService = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const checkResults = await query('SELECT * FROM dashboard_diagnostics_services WHERE id = $1', [id]);
    
    if (checkResults.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Diagnostics service not found'
      });
    }

    await query('DELETE FROM dashboard_diagnostics_services WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting diagnostics service:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 