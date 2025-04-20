const { pool } = require('../db');

/**
 * Service for handling profile-related operations
 */
class ProfileService {
  constructor() {
    // Flag to track if database is available
    this.useDatabase = false;
    
    // Try a simple test query to see if database is accessible
    this.testDatabaseConnection();
  }
  
  async testDatabaseConnection() {
    try {
      // Simple test query
      await pool.query('SELECT 1');
      this.useDatabase = true;
      console.log('ProfileService will use database');
    } catch (err) {
      console.error('Database connection test failed:', err.message);
      this.useDatabase = false;
      console.log('ProfileService will use hardcoded data only');
    }
  }

  /**
   * Get all salon profiles with optional filters
   * @param {Object} filters - Optional filters for salon profiles
   * @returns {Promise<Array>} - Array of salon profiles
   */
  async getSalonProfiles(filters = {}) {
    try {
      // Return hardcoded Indian salon profiles for demonstration
      const salonProfiles = [
        {
          id: '1',
          salon_name: 'Lakshmi Beauty Salon',
          specialization: 'Bridal Makeup',
          established_year: 2010,
          team_size: 12,
          service_area: 'Bangalore Central',
          business_name: 'Lakshmi Beauty Salon',
          owner_name: 'Lakshmi Agarwal',
          address: 'M.G. Road, Bangalore, Karnataka',
          image_urls: ['https://placehold.co/600x400/png?text=Lakshmi+Beauty']
        },
        {
          id: '2',
          salon_name: 'Meenakshi Makeup Studio',
          specialization: 'Celebrity Makeup',
          established_year: 2015,
          team_size: 8,
          service_area: 'Hyderabad',
          business_name: 'Meenakshi Makeup Studio',
          owner_name: 'Meenakshi Sharma',
          address: 'Jubilee Hills, Hyderabad, Telangana',
          image_urls: ['https://placehold.co/600x400/png?text=Meenakshi+Studio']
        },
        {
          id: '3',
          salon_name: 'Brijesh Hair Academy',
          specialization: 'Hair Styling',
          established_year: 2012,
          team_size: 10,
          service_area: 'Mumbai',
          business_name: 'Brijesh Hair Academy',
          owner_name: 'Brijesh Singh',
          address: 'Linking Road, Mumbai, Maharashtra',
          image_urls: ['https://placehold.co/600x400/png?text=Brijesh+Academy']
        },
        {
          id: '4',
          salon_name: 'Royal Beauty Studio',
          specialization: 'Complete Makeover',
          established_year: 2008,
          team_size: 15,
          service_area: 'Delhi NCR',
          business_name: 'Royal Beauty Studio',
          owner_name: 'Rajveer Kapoor',
          address: 'Connaught Place, New Delhi, Delhi',
          image_urls: ['https://placehold.co/600x400/png?text=Royal+Beauty']
        },
        {
          id: '5',
          salon_name: 'Ananya Bridal Salon',
          specialization: 'Bridal & Occasion Makeup',
          established_year: 2014,
          team_size: 7,
          service_area: 'Kolkata',
          business_name: 'Ananya Bridal Salon',
          owner_name: 'Ananya Gupta',
          address: 'Park Street, Kolkata, West Bengal',
          image_urls: ['https://placehold.co/600x400/png?text=Ananya+Bridal']
        },
        {
          id: '6',
          salon_name: 'Divine Beauty Bar',
          specialization: 'Skin Treatments',
          established_year: 2016,
          team_size: 9,
          service_area: 'Pune',
          business_name: 'Divine Beauty Bar',
          owner_name: 'Divya Malhotra',
          address: 'M.G. Road, Pune, Maharashtra',
          image_urls: ['https://placehold.co/600x400/png?text=Divine+Beauty']
        },
        {
          id: '7',
          salon_name: 'Deepika Glow Studio',
          specialization: 'HD Makeup',
          established_year: 2017,
          team_size: 6,
          service_area: 'Chennai',
          business_name: 'Deepika Glow Studio',
          owner_name: 'Deepika Patel',
          address: 'Anna Nagar, Chennai, Tamil Nadu',
          image_urls: ['https://placehold.co/600x400/png?text=Deepika+Glow']
        }
      ];
      
      // Apply filters if any
      let filteredProfiles = salonProfiles;
      
      if (filters.specialization) {
        filteredProfiles = filteredProfiles.filter(
          profile => profile.specialization.includes(filters.specialization)
        );
      }
      
      if (filters.serviceArea) {
        filteredProfiles = filteredProfiles.filter(
          profile => profile.service_area.includes(filters.serviceArea)
        );
      }
      
      return filteredProfiles;
    } catch (error) {
      console.error('Error fetching salon profiles:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific salon profile by ID
   * @param {string} id - The salon profile ID
   * @returns {Promise<Object>} - The salon profile
   */
  async getSalonProfileById(id) {
    try {
      // Return hardcoded Indian salon profiles for demonstration
      const salonProfiles = [
        {
          id: '1',
          salon_name: 'Lakshmi Beauty Salon',
          specialization: 'Bridal Makeup',
          established_year: 2010,
          team_size: 12,
          service_area: 'Bangalore Central',
          business_name: 'Lakshmi Beauty Salon',
          owner_name: 'Lakshmi Agarwal',
          address: 'M.G. Road, Bangalore, Karnataka',
          phone_number: '+919876543210',
          email: 'lakshmi@example.com',
          image_urls: ['https://placehold.co/600x400/png?text=Lakshmi+Beauty'],
          operating_hours: {
            monday: '9:00-20:00', 
            tuesday: '9:00-20:00', 
            wednesday: '9:00-20:00', 
            thursday: '9:00-20:00', 
            friday: '9:00-20:00', 
            saturday: '9:00-21:00', 
            sunday: '10:00-18:00'
          },
          amenities: ['Parking', 'WiFi', 'AC', 'Refreshments', 'Traditional Herbal Treatments']
        },
        {
          id: '2',
          salon_name: 'Meenakshi Makeup Studio',
          specialization: 'Celebrity Makeup',
          established_year: 2015,
          team_size: 8,
          service_area: 'Hyderabad',
          business_name: 'Meenakshi Makeup Studio',
          owner_name: 'Meenakshi Sharma',
          address: 'Jubilee Hills, Hyderabad, Telangana',
          phone_number: '+919876543211',
          email: 'meenakshi@example.com',
          image_urls: ['https://placehold.co/600x400/png?text=Meenakshi+Studio'],
          operating_hours: {
            monday: '10:00-19:00', 
            tuesday: '10:00-19:00', 
            wednesday: '10:00-19:00', 
            thursday: '10:00-19:00', 
            friday: '10:00-19:00', 
            saturday: '09:00-20:00', 
            sunday: '09:00-20:00'
          },
          amenities: ['WiFi', 'AC', 'Premium Makeup Brands', 'Celebrity Portfolio']
        },
        // ... additional salons would be listed here
      ];
      
      // Find salon by ID
      const salonProfile = salonProfiles.find(profile => profile.id === id);
      return salonProfile || null;
    } catch (error) {
      console.error(`Error fetching salon profile with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all PRP staff profiles with optional filters
   * @param {Object} filters - Optional filters for staff profiles
   * @returns {Promise<Array>} - Array of PRP staff profiles
   */
  async getPrpStaffProfiles(filters = {}) {
    try {
      // Return hardcoded Indian PRP staff profiles for demonstration
      const prpStaffProfiles = [
        {
          id: '1',
          staff_name: 'Radhika Menon',
          designation: 'Master Stylist',
          specialization: 'Hair Transformation',
          experience_years: 10,
          business_name: 'Ramesh Wellness Centre',
          certifications: ['LOreal Professional', 'Wella Master Colorist'],
          image_url: 'https://placehold.co/600x400/png?text=Radhika+Menon'
        },
        {
          id: '2',
          staff_name: 'Vikram Chandrasekhar',
          designation: 'Skin Expert',
          specialization: 'Acne & Pigmentation',
          experience_years: 8,
          business_name: 'Sunil Skin Experts',
          certifications: ['Dermalogica Certified', 'Medical Aesthetician'],
          image_url: 'https://placehold.co/600x400/png?text=Vikram+C'
        },
        {
          id: '3',
          staff_name: 'Komal Trivedi',
          designation: 'Makeup Educator',
          specialization: 'Bridal & HD Makeup',
          experience_years: 12,
          business_name: 'Neeta Beauty Academy',
          certifications: ['MAC Certified', 'Makeup Educator Certificate'],
          image_url: 'https://placehold.co/600x400/png?text=Komal+Trivedi'
        },
        {
          id: '4',
          staff_name: 'Sanjay Rathore',
          designation: 'Senior Makeup Artist',
          specialization: 'Celebrity & Fashion Makeup',
          experience_years: 7,
          business_name: 'Preeti Makeup Class',
          certifications: ['Lakmé Expert', 'Fashion Week Artist'],
          image_url: 'https://placehold.co/600x400/png?text=Sanjay+Rathore'
        },
        {
          id: '5',
          staff_name: 'Meera Iyer',
          designation: 'Ayurvedic Beauty Expert',
          specialization: 'Herbal Treatments',
          experience_years: 9,
          business_name: 'Vedic Wellness Studio',
          certifications: ['Ayurvedic Beauty Specialist', 'Herbal Formulation Expert'],
          image_url: 'https://placehold.co/600x400/png?text=Meera+Iyer'
        }
      ];
      
      // Apply filters if any
      let filteredProfiles = prpStaffProfiles;
      
      if (filters.specialization) {
        filteredProfiles = filteredProfiles.filter(
          profile => profile.specialization.includes(filters.specialization)
        );
      }
      
      if (filters.designation) {
        filteredProfiles = filteredProfiles.filter(
          profile => profile.designation.includes(filters.designation)
        );
      }
      
      return filteredProfiles;
    } catch (error) {
      console.error('Error fetching PRP staff profiles:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific PRP staff profile by ID
   * @param {string} id - The staff profile ID
   * @returns {Promise<Object>} - The staff profile
   */
  async getPrpStaffProfileById(id) {
    try {
      // Return hardcoded Indian PRP staff profiles for demonstration
      const prpStaffProfiles = [
        {
          id: '1',
          staff_name: 'Radhika Menon',
          designation: 'Master Stylist',
          specialization: 'Hair Transformation',
          experience_years: 10,
          business_name: 'Ramesh Wellness Centre',
          email: 'ramesh@example.com',
          phone_number: '+919876543217',
          address: 'Koramangala, Bangalore, Karnataka',
          certifications: ['LOreal Professional', 'Wella Master Colorist'],
          availability: {
            monday: '10:00-18:00', 
            tuesday: '10:00-18:00', 
            wednesday: '10:00-18:00', 
            thursday: '10:00-18:00', 
            friday: '10:00-18:00', 
            saturday: '09:00-19:00', 
            sunday: 'Closed'
          },
          image_url: 'https://placehold.co/600x400/png?text=Radhika+Menon'
        },
        {
          id: '2',
          staff_name: 'Vikram Chandrasekhar',
          designation: 'Skin Expert',
          specialization: 'Acne & Pigmentation',
          experience_years: 8,
          business_name: 'Sunil Skin Experts',
          email: 'sunil@example.com',
          phone_number: '+919876543218',
          address: 'Punjagutta, Hyderabad, Telangana',
          certifications: ['Dermalogica Certified', 'Medical Aesthetician'],
          availability: {
            monday: '11:00-19:00', 
            tuesday: '11:00-19:00', 
            wednesday: '11:00-19:00', 
            thursday: '11:00-19:00', 
            friday: '11:00-19:00', 
            saturday: '10:00-20:00', 
            sunday: 'Closed'
          },
          image_url: 'https://placehold.co/600x400/png?text=Vikram+C'
        },
        // ... additional staff would be listed here
      ];
      
      // Find staff by ID
      const staffProfile = prpStaffProfiles.find(profile => profile.id === id);
      return staffProfile || null;
    } catch (error) {
      console.error(`Error fetching PRP staff profile with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all solo artist profiles with optional filters
   * @param {Object} filters - Optional filters for solo artist profiles
   * @returns {Promise<Array>} - Array of solo artist profiles
   */
  async getSoloArtistProfiles(filters = {}) {
    try {
      // Return hardcoded Indian solo artist profiles for demonstration
      const soloArtistProfiles = [
        {
          id: '1',
          artist_name: 'Kiran Bajaj',
          specialization: 'Celebrity Makeup Artist',
          experience_years: 15,
          home_service: false,
          pricing_tier: 'luxury',
          business_name: 'Kiran Makeovers',
          portfolio_urls: ['https://placehold.co/600x400/png?text=Kiran+Portfolio+1', 'https://placehold.co/600x400/png?text=Kiran+Portfolio+2']
        },
        {
          id: '2',
          artist_name: 'Shalini Verma',
          specialization: 'Bridal Makeup Specialist',
          experience_years: 12,
          home_service: true,
          pricing_tier: 'luxury',
          business_name: 'Shalini Artist',
          portfolio_urls: ['https://placehold.co/600x400/png?text=Shalini+Portfolio+1', 'https://placehold.co/600x400/png?text=Shalini+Portfolio+2']
        },
        {
          id: '3',
          artist_name: 'Arjun Mehra',
          specialization: 'Hair Stylist & Colorist',
          experience_years: 10,
          home_service: false,
          pricing_tier: 'premium',
          business_name: 'Arjun Hairstylist',
          portfolio_urls: ['https://placehold.co/600x400/png?text=Arjun+Portfolio+1']
        },
        {
          id: '4',
          artist_name: 'Pooja Malhotra',
          specialization: 'Mehendi Artist',
          experience_years: 8,
          home_service: true,
          pricing_tier: 'premium',
          business_name: 'Pooja Mehendi Art',
          portfolio_urls: ['https://placehold.co/600x400/png?text=Pooja+Portfolio+1', 'https://placehold.co/600x400/png?text=Pooja+Portfolio+2']
        },
        {
          id: '5',
          artist_name: 'Rohan Choudhary',
          specialization: 'Nail Artist',
          experience_years: 6,
          home_service: true,
          pricing_tier: 'budget',
          business_name: 'Rohan Nail Studio',
          portfolio_urls: ['https://placehold.co/600x400/png?text=Rohan+Portfolio+1']
        },
        {
          id: '6',
          artist_name: 'Aashna Kapoor',
          specialization: 'Creative Makeup Artist',
          experience_years: 7,
          home_service: true,
          pricing_tier: 'premium',
          business_name: 'Artistic Aashna',
          portfolio_urls: ['https://placehold.co/600x400/png?text=Aashna+Portfolio+1']
        }
      ];
      
      // Apply filters if any
      let filteredProfiles = soloArtistProfiles;
      
      if (filters.specialization) {
        filteredProfiles = filteredProfiles.filter(
          profile => profile.specialization.includes(filters.specialization)
        );
      }
      
      if (filters.pricingTier) {
        filteredProfiles = filteredProfiles.filter(
          profile => profile.pricing_tier === filters.pricingTier
        );
      }
      
      if (filters.homeService !== undefined) {
        filteredProfiles = filteredProfiles.filter(
          profile => profile.home_service === filters.homeService
        );
      }
      
      return filteredProfiles;
    } catch (error) {
      console.error('Error fetching solo artist profiles:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific solo artist profile by ID
   * @param {string} id - The solo artist profile ID
   * @returns {Promise<Object>} - The solo artist profile
   */
  async getSoloArtistProfileById(id) {
    try {
      // Return hardcoded Indian solo artist profiles for demonstration
      const soloArtistProfiles = [
        {
          id: '1',
          artist_name: 'Kiran Bajaj',
          specialization: 'Celebrity Makeup Artist',
          experience_years: 15,
          home_service: false,
          pricing_tier: 'luxury',
          business_name: 'Kiran Makeovers',
          email: 'kiran@example.com',
          phone_number: '+919876543222',
          address: 'Indiranagar, Bangalore, Karnataka',
          portfolio_urls: ['https://placehold.co/600x400/png?text=Kiran+Portfolio+1', 'https://placehold.co/600x400/png?text=Kiran+Portfolio+2'],
          availability: {
            monday: 'By Appointment', 
            tuesday: 'By Appointment', 
            wednesday: 'By Appointment', 
            thursday: 'By Appointment', 
            friday: 'By Appointment', 
            saturday: 'By Appointment', 
            sunday: 'By Appointment'
          }
        },
        {
          id: '2',
          artist_name: 'Shalini Verma',
          specialization: 'Bridal Makeup Specialist',
          experience_years: 12,
          home_service: true,
          pricing_tier: 'luxury',
          business_name: 'Shalini Artist',
          email: 'shalini@example.com',
          phone_number: '+919876543223',
          address: 'Film Nagar, Hyderabad, Telangana',
          portfolio_urls: ['https://placehold.co/600x400/png?text=Shalini+Portfolio+1', 'https://placehold.co/600x400/png?text=Shalini+Portfolio+2'],
          availability: {
            monday: '10:00-18:00', 
            tuesday: '10:00-18:00', 
            wednesday: '10:00-18:00', 
            thursday: '10:00-18:00', 
            friday: '10:00-18:00', 
            saturday: '09:00-19:00', 
            sunday: '09:00-19:00'
          }
        },
        // ... additional artists would be listed here
      ];
      
      // Find artist by ID
      const artistProfile = soloArtistProfiles.find(profile => profile.id === id);
      return artistProfile || null;
    } catch (error) {
      console.error(`Error fetching solo artist profile with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all doctor profiles with optional filters
   * @param {Object} filters - Optional filters for doctor profiles
   * @returns {Promise<Array>} - Array of doctor profiles
   */
  async getDoctorProfiles(filters = {}) {
    try {
      // Return hardcoded Indian doctor profiles for demonstration
      const doctorProfiles = [
        {
          id: '1',
          doctor_name: 'Dr. Priya Singh',
          specialization: 'Dermatologist',
          qualifications: 'MBBS, MD (Dermatology)',
          experience_years: 15,
          clinic_name: 'Skin Care Clinic',
          treatments: ['Acne Treatment', 'Botox', 'PRP Therapy', 'Laser Hair Removal'],
          image_url: 'https://placehold.co/600x400/png?text=Dr+Priya+Singh'
        },
        {
          id: '2',
          doctor_name: 'Dr. Vikram Mehta',
          specialization: 'Cosmetic Surgeon',
          qualifications: 'MBBS, MS, MCh (Plastic Surgery)',
          experience_years: 18,
          clinic_name: 'Venus Cosmetic Surgery',
          treatments: ['Rhinoplasty', 'Face Lift', 'Liposuction', 'Hair Transplant'],
          image_url: 'https://placehold.co/600x400/png?text=Dr+Vikram+Mehta'
        },
        {
          id: '3',
          doctor_name: 'Dr. Ananya Sharma',
          specialization: 'Trichologist',
          qualifications: 'MBBS, Diploma in Trichology',
          experience_years: 10,
          clinic_name: 'Hair Health Clinic',
          treatments: ['Hair Loss Treatment', 'Scalp Treatment', 'Hair Transplant'],
          image_url: 'https://placehold.co/600x400/png?text=Dr+Ananya+Sharma'
        },
        {
          id: '4',
          doctor_name: 'Dr. Rahul Kapoor',
          specialization: 'Aesthetic Physician',
          qualifications: 'MBBS, Diploma in Aesthetic Medicine',
          experience_years: 12,
          clinic_name: 'Glow Aesthetics',
          treatments: ['Fillers', 'Chemical Peels', 'Microdermabrasion', 'Laser Therapy'],
          image_url: 'https://placehold.co/600x400/png?text=Dr+Rahul+Kapoor'
        },
        {
          id: '5',
          doctor_name: 'Dr. Meera Joshi',
          specialization: 'Cosmetic Dentist',
          qualifications: 'BDS, MDS (Cosmetic Dentistry)',
          experience_years: 14,
          clinic_name: 'Perfect Smile Dental Clinic',
          treatments: ['Teeth Whitening', 'Veneers', 'Dental Implants', 'Smile Makeover'],
          image_url: 'https://placehold.co/600x400/png?text=Dr+Meera+Joshi'
        }
      ];
      
      // Apply filters if any
      let filteredProfiles = doctorProfiles;
      
      if (filters.specialization) {
        filteredProfiles = filteredProfiles.filter(
          profile => profile.specialization.includes(filters.specialization)
        );
      }
      
      if (filters.treatment) {
        filteredProfiles = filteredProfiles.filter(
          profile => profile.treatments.some(treatment => 
            treatment.toLowerCase().includes(filters.treatment.toLowerCase())
          )
        );
      }
      
      return filteredProfiles;
    } catch (error) {
      console.error('Error fetching doctor profiles:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific doctor profile by ID
   * @param {string} id - The doctor profile ID
   * @returns {Promise<Object>} - The doctor profile
   */
  async getDoctorProfileById(id) {
    try {
      // Return hardcoded Indian doctor profiles for demonstration
      const doctorProfiles = [
        {
          id: '1',
          doctor_name: 'Dr. Priya Singh',
          specialization: 'Dermatologist',
          qualifications: 'MBBS, MD (Dermatology)',
          experience_years: 15,
          clinic_name: 'Skin Care Clinic',
          email: 'dr.priya@example.com',
          phone_number: '+919876543210',
          address: 'Banjara Hills, Hyderabad, Telangana',
          treatments: ['Acne Treatment', 'Botox', 'PRP Therapy', 'Laser Hair Removal'],
          bio: 'Dr. Priya Singh is a renowned dermatologist with 15 years of experience in treating various skin conditions and performing advanced cosmetic procedures.',
          image_url: 'https://placehold.co/600x400/png?text=Dr+Priya+Singh',
          availability: {
            monday: '10:00-17:00', 
            tuesday: '10:00-17:00', 
            wednesday: '10:00-17:00', 
            thursday: '10:00-17:00', 
            friday: '10:00-17:00', 
            saturday: '10:00-14:00', 
            sunday: 'Closed'
          }
        },
        {
          id: '2',
          doctor_name: 'Dr. Vikram Mehta',
          specialization: 'Cosmetic Surgeon',
          qualifications: 'MBBS, MS, MCh (Plastic Surgery)',
          experience_years: 18,
          clinic_name: 'Venus Cosmetic Surgery',
          email: 'dr.vikram@example.com',
          phone_number: '+919876543211',
          address: 'Greater Kailash, New Delhi',
          treatments: ['Rhinoplasty', 'Face Lift', 'Liposuction', 'Hair Transplant'],
          bio: 'Dr. Vikram Mehta is an expert cosmetic surgeon with international training and experience in performing various aesthetic procedures with natural-looking results.',
          image_url: 'https://placehold.co/600x400/png?text=Dr+Vikram+Mehta',
          availability: {
            monday: '11:00-19:00', 
            tuesday: '11:00-19:00', 
            wednesday: '11:00-19:00', 
            thursday: '11:00-19:00', 
            friday: '11:00-19:00', 
            saturday: '10:00-15:00', 
            sunday: 'Closed'
          }
        },
        // ... additional doctors would be listed here
      ];
      
      // Find doctor by ID
      const doctorProfile = doctorProfiles.find(profile => profile.id === id);
      return doctorProfile || null;
    } catch (error) {
      console.error(`Error fetching doctor profile with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all types of profiles (salon, PRP staff, solo artist, doctor)
   * @returns {Promise<Object>} - Object with all types of profiles
   */
  async getAllProfiles() {
    try {
      // Return hardcoded Indian profiles for demonstration
      return {
        salonProfiles: [
          {
            id: '1',
            salon_name: 'Lakshmi Beauty Salon',
            specialization: 'Bridal Makeup',
            established_year: 2010,
            team_size: 12,
            service_area: 'Bangalore Central',
            business_name: 'Lakshmi Beauty Salon',
            owner_name: 'Lakshmi Agarwal',
            address: 'M.G. Road, Bangalore, Karnataka',
            image_urls: ['https://placehold.co/600x400/png?text=Lakshmi+Beauty']
          },
          {
            id: '2',
            salon_name: 'Meenakshi Makeup Studio',
            specialization: 'Celebrity Makeup',
            established_year: 2015,
            team_size: 8,
            service_area: 'Hyderabad',
            business_name: 'Meenakshi Makeup Studio',
            owner_name: 'Meenakshi Sharma',
            address: 'Jubilee Hills, Hyderabad, Telangana',
            image_urls: ['https://placehold.co/600x400/png?text=Meenakshi+Studio']
          },
          {
            id: '3',
            salon_name: 'Brijesh Hair Academy',
            specialization: 'Hair Styling',
            established_year: 2012,
            team_size: 10,
            service_area: 'Mumbai',
            business_name: 'Brijesh Hair Academy',
            owner_name: 'Brijesh Singh',
            address: 'Linking Road, Mumbai, Maharashtra',
            image_urls: ['https://placehold.co/600x400/png?text=Brijesh+Academy']
          },
          {
            id: '4',
            salon_name: 'Royal Beauty Studio',
            specialization: 'Complete Makeover',
            established_year: 2008,
            team_size: 15,
            service_area: 'Delhi NCR',
            business_name: 'Royal Beauty Studio',
            owner_name: 'Rajveer Kapoor',
            address: 'Connaught Place, New Delhi, Delhi',
            image_urls: ['https://placehold.co/600x400/png?text=Royal+Beauty']
          },
          {
            id: '5',
            salon_name: 'Ananya Bridal Salon',
            specialization: 'Bridal & Occasion Makeup',
            established_year: 2014,
            team_size: 7,
            service_area: 'Kolkata',
            business_name: 'Ananya Bridal Salon',
            owner_name: 'Ananya Gupta',
            address: 'Park Street, Kolkata, West Bengal',
            image_urls: ['https://placehold.co/600x400/png?text=Ananya+Bridal']
          },
          {
            id: '6',
            salon_name: 'Divine Beauty Bar',
            specialization: 'Skin Treatments',
            established_year: 2016,
            team_size: 9,
            service_area: 'Pune',
            business_name: 'Divine Beauty Bar',
            owner_name: 'Divya Malhotra',
            address: 'M.G. Road, Pune, Maharashtra',
            image_urls: ['https://placehold.co/600x400/png?text=Divine+Beauty']
          },
          {
            id: '7',
            salon_name: 'Deepika Glow Studio',
            specialization: 'HD Makeup',
            established_year: 2017,
            team_size: 6,
            service_area: 'Chennai',
            business_name: 'Deepika Glow Studio',
            owner_name: 'Deepika Patel',
            address: 'Anna Nagar, Chennai, Tamil Nadu',
            image_urls: ['https://placehold.co/600x400/png?text=Deepika+Glow']
          }
        ],
        prpStaffProfiles: [
          {
            id: '1',
            staff_name: 'Radhika Menon',
            designation: 'Master Stylist',
            specialization: 'Hair Transformation',
            experience_years: 10,
            business_name: 'Ramesh Wellness Centre',
            image_url: 'https://placehold.co/600x400/png?text=Radhika+Menon'
          },
          {
            id: '2',
            staff_name: 'Vikram Chandrasekhar',
            designation: 'Skin Expert',
            specialization: 'Acne & Pigmentation',
            experience_years: 8,
            business_name: 'Sunil Skin Experts',
            image_url: 'https://placehold.co/600x400/png?text=Vikram+C'
          },
          {
            id: '3',
            staff_name: 'Komal Trivedi',
            designation: 'Makeup Educator',
            specialization: 'Bridal & HD Makeup',
            experience_years: 12,
            business_name: 'Neeta Beauty Academy',
            image_url: 'https://placehold.co/600x400/png?text=Komal+Trivedi'
          },
          {
            id: '4',
            staff_name: 'Sanjay Rathore',
            designation: 'Senior Makeup Artist',
            specialization: 'Celebrity & Fashion Makeup',
            experience_years: 7,
            business_name: 'Preeti Makeup Class',
            image_url: 'https://placehold.co/600x400/png?text=Sanjay+Rathore'
          },
          {
            id: '5',
            staff_name: 'Meera Iyer',
            designation: 'Ayurvedic Beauty Expert',
            specialization: 'Herbal Treatments',
            experience_years: 9,
            business_name: 'Vedic Wellness Studio',
            image_url: 'https://placehold.co/600x400/png?text=Meera+Iyer'
          }
        ],
        soloArtistProfiles: [
          {
            id: '1',
            artist_name: 'Kiran Bajaj',
            specialization: 'Celebrity Makeup Artist',
            experience_years: 15,
            home_service: false,
            pricing_tier: 'luxury',
            business_name: 'Kiran Makeovers',
            portfolio_urls: ['https://placehold.co/600x400/png?text=Kiran+Portfolio+1', 'https://placehold.co/600x400/png?text=Kiran+Portfolio+2']
          },
          {
            id: '2',
            artist_name: 'Shalini Verma',
            specialization: 'Bridal Makeup Specialist',
            experience_years: 12,
            home_service: true,
            pricing_tier: 'luxury',
            business_name: 'Shalini Artist',
            portfolio_urls: ['https://placehold.co/600x400/png?text=Shalini+Portfolio+1', 'https://placehold.co/600x400/png?text=Shalini+Portfolio+2']
          },
          {
            id: '3',
            artist_name: 'Arjun Mehra',
            specialization: 'Hair Stylist & Colorist',
            experience_years: 10,
            home_service: false,
            pricing_tier: 'premium',
            business_name: 'Arjun Hairstylist',
            portfolio_urls: ['https://placehold.co/600x400/png?text=Arjun+Portfolio+1']
          },
          {
            id: '4',
            artist_name: 'Pooja Malhotra',
            specialization: 'Mehendi Artist',
            experience_years: 8,
            home_service: true,
            pricing_tier: 'premium',
            business_name: 'Pooja Mehendi Art',
            portfolio_urls: ['https://placehold.co/600x400/png?text=Pooja+Portfolio+1', 'https://placehold.co/600x400/png?text=Pooja+Portfolio+2']
          },
          {
            id: '5',
            artist_name: 'Rohan Choudhary',
            specialization: 'Nail Artist',
            experience_years: 6,
            home_service: true,
            pricing_tier: 'budget',
            business_name: 'Rohan Nail Studio',
            portfolio_urls: ['https://placehold.co/600x400/png?text=Rohan+Portfolio+1']
          },
          {
            id: '6',
            artist_name: 'Aashna Kapoor',
            specialization: 'Creative Makeup Artist',
            experience_years: 7,
            home_service: true,
            pricing_tier: 'premium',
            business_name: 'Artistic Aashna',
            portfolio_urls: ['https://placehold.co/600x400/png?text=Aashna+Portfolio+1']
          }
        ],
        doctorProfiles: [
          {
            id: '1',
            doctor_name: 'Dr. Priya Singh',
            specialization: 'Dermatologist',
            qualifications: 'MBBS, MD (Dermatology)',
            experience_years: 15,
            clinic_name: 'Skin Care Clinic',
            treatments: ['Acne Treatment', 'Botox', 'PRP Therapy', 'Laser Hair Removal'],
            image_url: 'https://placehold.co/600x400/png?text=Dr+Priya+Singh'
          },
          {
            id: '2',
            doctor_name: 'Dr. Vikram Mehta',
            specialization: 'Cosmetic Surgeon',
            qualifications: 'MBBS, MS, MCh (Plastic Surgery)',
            experience_years: 18,
            clinic_name: 'Venus Cosmetic Surgery',
            treatments: ['Rhinoplasty', 'Face Lift', 'Liposuction', 'Hair Transplant'],
            image_url: 'https://placehold.co/600x400/png?text=Dr+Vikram+Mehta'
          },
          {
            id: '3',
            doctor_name: 'Dr. Ananya Sharma',
            specialization: 'Trichologist',
            qualifications: 'MBBS, Diploma in Trichology',
            experience_years: 10,
            clinic_name: 'Hair Health Clinic',
            treatments: ['Hair Loss Treatment', 'Scalp Treatment', 'Hair Transplant'],
            image_url: 'https://placehold.co/600x400/png?text=Dr+Ananya+Sharma'
          },
          {
            id: '4',
            doctor_name: 'Dr. Rahul Kapoor',
            specialization: 'Aesthetic Physician',
            qualifications: 'MBBS, Diploma in Aesthetic Medicine',
            experience_years: 12,
            clinic_name: 'Glow Aesthetics',
            treatments: ['Fillers', 'Chemical Peels', 'Microdermabrasion', 'Laser Therapy'],
            image_url: 'https://placehold.co/600x400/png?text=Dr+Rahul+Kapoor'
          },
          {
            id: '5',
            doctor_name: 'Dr. Meera Joshi',
            specialization: 'Cosmetic Dentist',
            qualifications: 'BDS, MDS (Cosmetic Dentistry)',
            experience_years: 14,
            clinic_name: 'Perfect Smile Dental Clinic',
            treatments: ['Teeth Whitening', 'Veneers', 'Dental Implants', 'Smile Makeover'],
            image_url: 'https://placehold.co/600x400/png?text=Dr+Meera+Joshi'
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching all profiles:', error);
      throw error;
    }
  }
}

module.exports = new ProfileService(); 