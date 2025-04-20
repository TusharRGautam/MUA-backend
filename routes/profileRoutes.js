const express = require('express');
const router = express.Router();
const profileService = require('../services/profileService');
const { authenticateToken, optionalAuthentication } = require('../middleware/auth');

/**
 * @route GET /api/profiles/all
 * @desc Get all types of profiles
 * @access Public
 */
router.get('/all', optionalAuthentication, async (req, res) => {
  try {
    const allProfiles = await profileService.getAllProfiles();
    res.json(allProfiles);
  } catch (error) {
    console.error('Error in /profiles/all route:', error);
    res.status(500).json({ error: 'Server error fetching profiles' });
  }
});

/**
 * @route GET /api/profiles/salons
 * @desc Get all salon profiles with optional filters
 * @access Public
 */
router.get('/salons', optionalAuthentication, async (req, res) => {
  try {
    const filters = {
      specialization: req.query.specialization,
      serviceArea: req.query.serviceArea
    };
    
    const salonProfiles = await profileService.getSalonProfiles(filters);
    res.json(salonProfiles);
  } catch (error) {
    console.error('Error in /profiles/salons route:', error);
    res.status(500).json({ error: 'Server error fetching salon profiles' });
  }
});

/**
 * @route GET /api/profiles/salons/:id
 * @desc Get a specific salon profile by ID
 * @access Public
 */
router.get('/salons/:id', optionalAuthentication, async (req, res) => {
  try {
    const salonProfile = await profileService.getSalonProfileById(req.params.id);
    
    if (!salonProfile) {
      return res.status(404).json({ error: 'Salon profile not found' });
    }
    
    res.json(salonProfile);
  } catch (error) {
    console.error(`Error in /profiles/salons/${req.params.id} route:`, error);
    res.status(500).json({ error: 'Server error fetching salon profile' });
  }
});

/**
 * @route GET /api/profiles/prp-staff
 * @desc Get all PRP staff profiles with optional filters
 * @access Public
 */
router.get('/prp-staff', optionalAuthentication, async (req, res) => {
  try {
    const filters = {
      specialization: req.query.specialization,
      designation: req.query.designation
    };
    
    const prpStaffProfiles = await profileService.getPrpStaffProfiles(filters);
    res.json(prpStaffProfiles);
  } catch (error) {
    console.error('Error in /profiles/prp-staff route:', error);
    res.status(500).json({ error: 'Server error fetching PRP staff profiles' });
  }
});

/**
 * @route GET /api/profiles/prp-staff/:id
 * @desc Get a specific PRP staff profile by ID
 * @access Public
 */
router.get('/prp-staff/:id', optionalAuthentication, async (req, res) => {
  try {
    const prpStaffProfile = await profileService.getPrpStaffProfileById(req.params.id);
    
    if (!prpStaffProfile) {
      return res.status(404).json({ error: 'PRP staff profile not found' });
    }
    
    res.json(prpStaffProfile);
  } catch (error) {
    console.error(`Error in /profiles/prp-staff/${req.params.id} route:`, error);
    res.status(500).json({ error: 'Server error fetching PRP staff profile' });
  }
});

/**
 * @route GET /api/profiles/solo-artists
 * @desc Get all solo artist profiles with optional filters
 * @access Public
 */
router.get('/solo-artists', optionalAuthentication, async (req, res) => {
  try {
    const filters = {
      specialization: req.query.specialization,
      pricingTier: req.query.pricingTier,
      homeService: req.query.homeService === 'true' ? true : 
                  req.query.homeService === 'false' ? false : undefined
    };
    
    const soloArtistProfiles = await profileService.getSoloArtistProfiles(filters);
    res.json(soloArtistProfiles);
  } catch (error) {
    console.error('Error in /profiles/solo-artists route:', error);
    res.status(500).json({ error: 'Server error fetching solo artist profiles' });
  }
});

/**
 * @route GET /api/profiles/solo-artists/:id
 * @desc Get a specific solo artist profile by ID
 * @access Public
 */
router.get('/solo-artists/:id', optionalAuthentication, async (req, res) => {
  try {
    const soloArtistProfile = await profileService.getSoloArtistProfileById(req.params.id);
    
    if (!soloArtistProfile) {
      return res.status(404).json({ error: 'Solo artist profile not found' });
    }
    
    res.json(soloArtistProfile);
  } catch (error) {
    console.error(`Error in /profiles/solo-artists/${req.params.id} route:`, error);
    res.status(500).json({ error: 'Server error fetching solo artist profile' });
  }
});

/**
 * @route GET /api/profiles/doctors
 * @desc Get all doctor profiles with optional filters
 * @access Public
 */
router.get('/doctors', optionalAuthentication, async (req, res) => {
  try {
    const filters = {
      specialization: req.query.specialization,
      minExperience: req.query.minExperience ? parseInt(req.query.minExperience) : undefined,
      maxConsultationFee: req.query.maxConsultationFee ? parseFloat(req.query.maxConsultationFee) : undefined
    };
    
    const doctorProfiles = await profileService.getDoctorProfiles(filters);
    res.json(doctorProfiles);
  } catch (error) {
    console.error('Error in /profiles/doctors route:', error);
    res.status(500).json({ error: 'Server error fetching doctor profiles' });
  }
});

/**
 * @route GET /api/profiles/doctors/:id
 * @desc Get a specific doctor profile by ID
 * @access Public
 */
router.get('/doctors/:id', optionalAuthentication, async (req, res) => {
  try {
    const doctorProfile = await profileService.getDoctorProfileById(req.params.id);
    
    if (!doctorProfile) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }
    
    res.json(doctorProfile);
  } catch (error) {
    console.error(`Error in /profiles/doctors/${req.params.id} route:`, error);
    res.status(500).json({ error: 'Server error fetching doctor profile' });
  }
});

module.exports = router; 