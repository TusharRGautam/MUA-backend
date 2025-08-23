const { Pool } = require('pg');
const {
  calculatePayoutSplit,
  validatePayoutAmount,
  createPayoutContact,
  createFundAccount,
  createPayout,
  getPayoutStatus,
  mapPayoutStatus,
  generatePayoutReference,
  logPayoutActivity,
  COMPANY_ACCOUNT
} = require('../config/razorpayPayout');

// Use the existing database connection from db.js
const { query } = require('../db');

/**
 * Process Razorpay payout split for completed booking
 */
const processPayoutSplit = async (payoutData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 Processing payout split for booking:', payoutData.bookingId);
    logPayoutActivity('payout_split_initiated', payoutData);
    
    // 1. Get booking details
    const bookingQuery = `
      SELECT 
        id, booking_id, total_amount, assigned_vendor_id, 
        razorpay_payment_id, vendor_settlement_status,
        user_name, user_phone, user_email, service_name
      FROM booking_all_details_of_user_to_vendor 
      WHERE id = $1 OR booking_id = $1
    `;
    
    const bookingResult = await client.query(bookingQuery, [payoutData.bookingId]);
    
    if (bookingResult.rows.length === 0) {
      throw new Error(`Booking not found: ${payoutData.bookingId}`);
    }
    
    const booking = bookingResult.rows[0];
    
    // Check if payout already processed
    if (booking.vendor_settlement_status === 'settled' || 
        booking.vendor_settlement_status === 'processing') {
      console.log('⚠️ Payout already processed for booking:', payoutData.bookingId);
      return {
        success: false,
        error: 'Payout already processed for this booking',
        data: {
          status: booking.vendor_settlement_status,
          bookingId: payoutData.bookingId
        }
      };
    }
    
    // 2. Get vendor details
    const vendorQuery = `
      SELECT 
        sr_no, email, phone, business_name, 
        account_number, ifsc_code, account_holder_name,
        razorpay_contact_id, razorpay_fund_account_id
      FROM ready_services_vendors_data 
      WHERE sr_no = $1
    `;
    
    const vendorResult = await client.query(vendorQuery, [booking.assigned_vendor_id]);
    
    if (vendorResult.rows.length === 0) {
      throw new Error(`Vendor not found: ${booking.assigned_vendor_id}`);
    }
    
    const vendor = vendorResult.rows[0];
    
    // 3. Calculate payout amounts
    const totalAmount = parseFloat(booking.total_amount);
    const { vendorAmount, companyAmount } = calculatePayoutSplit(totalAmount);
    
    // Validate amounts
    const amountValidation = validatePayoutAmount(vendorAmount);
    if (!amountValidation.valid) {
      throw new Error(`Invalid vendor payout amount: ${amountValidation.error}`);
    }
    
    console.log('💰 Payout split calculated:', {
      totalAmount,
      vendorAmount,
      companyAmount,
      vendorId: booking.assigned_vendor_id
    });
    
    // 4. Update booking with payout details
    const updateBookingQuery = `
      UPDATE booking_all_details_of_user_to_vendor 
      SET 
        vendor_razorpay_payment_id = $1,
        vendor_amount = $2,
        vendor_company_amount = $3,
        vendor_settlement_status = 'pending',
        vendor_payout_initiated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id
    `;
    
    await client.query(updateBookingQuery, [
      booking.razorpay_payment_id,
      vendorAmount,
      companyAmount,
      booking.id
    ]);
    
    // 5. Process vendor payout if account details available
    let vendorPayoutResult = null;
    
    if (vendor.account_number && vendor.ifsc_code && vendor.account_holder_name) {
      console.log('🏦 Processing vendor payout with bank details...');
      
      try {
        // Create or get payout contact
        let contactId = vendor.razorpay_contact_id;
        
        if (!contactId) {
          const contactResult = await createPayoutContact({
            name: vendor.business_name || vendor.account_holder_name,
            email: vendor.email,
            phone: vendor.phone,
            vendorId: vendor.sr_no
          });
          
          if (contactResult.success) {
            contactId = contactResult.contact.id;
            
            // Update vendor with contact ID
            await client.query(
              'UPDATE ready_services_vendors_data SET razorpay_contact_id = $1 WHERE sr_no = $2',
              [contactId, vendor.sr_no]
            );
          } else {
            throw new Error(`Failed to create payout contact: ${contactResult.error}`);
          }
        }
        
        // Create or get fund account
        let fundAccountId = vendor.razorpay_fund_account_id;
        
        if (!fundAccountId) {
          const fundAccountResult = await createFundAccount(contactId, {
            accountHolderName: vendor.account_holder_name,
            accountNumber: vendor.account_number,
            ifsc: vendor.ifsc_code
          });
          
          if (fundAccountResult.success) {
            fundAccountId = fundAccountResult.fundAccount.id;
            
            // Update vendor with fund account ID
            await client.query(
              'UPDATE ready_services_vendors_data SET razorpay_fund_account_id = $1 WHERE sr_no = $2',
              [fundAccountId, vendor.sr_no]
            );
          } else {
            throw new Error(`Failed to create fund account: ${fundAccountResult.error}`);
          }
        }
        
        // Create vendor payout
        const vendorPayoutData = {
          fundAccountId,
          amount: vendorAmount,
          referenceId: generatePayoutReference(payoutData.bookingId, 'vendor'),
          purpose: 'payout',
          narration: `Carelook vendor payout for booking ${payoutData.bookingId} - ${booking.service_name}`
        };
        
        vendorPayoutResult = await createPayout(vendorPayoutData);
        
        if (vendorPayoutResult.success) {
          // Update booking with vendor transfer ID
          await client.query(
            `UPDATE booking_all_details_of_user_to_vendor 
             SET vendor_razorpay_transfer_id_vendor = $1, vendor_settlement_status = 'processing'
             WHERE id = $2`,
            [vendorPayoutResult.payout.id, booking.id]
          );
          
          logPayoutActivity('vendor_payout_created', {
            bookingId: payoutData.bookingId,
            payoutId: vendorPayoutResult.payout.id,
            amount: vendorAmount
          });
        } else {
          throw new Error(`Vendor payout failed: ${vendorPayoutResult.error}`);
        }
        
      } catch (error) {
        console.error('❌ Vendor payout error:', error);
        
        // Update booking with error details
        await client.query(
          `UPDATE booking_all_details_of_user_to_vendor 
           SET vendor_settlement_status = 'failed', 
               vendor_error_code = $1, 
               vendor_error_description = $2
           WHERE id = $3`,
          ['VENDOR_PAYOUT_FAILED', error.message, booking.id]
        );
        
        logPayoutActivity('vendor_payout_failed', {
          bookingId: payoutData.bookingId,
          error: error.message
        }, 'error');
        
        // Don't throw error here, continue with company payout
        vendorPayoutResult = { success: false, error: error.message };
      }
    } else {
      console.log('⚠️ Vendor bank details not available, skipping payout');
      
      // Update status to pending with note
      await client.query(
        `UPDATE booking_all_details_of_user_to_vendor 
         SET vendor_settlement_status = 'pending',
             vendor_error_code = 'BANK_DETAILS_MISSING',
             vendor_error_description = 'Vendor bank account details not provided'
         WHERE id = $1`,
        [booking.id]
      );
      
      logPayoutActivity('vendor_payout_skipped', {
        bookingId: payoutData.bookingId,
        reason: 'Bank details missing'
      }, 'warn');
    }
    
    // 6. Process company payout (optional - company might handle this differently)
    let companyPayoutResult = null;
    
    if (COMPANY_ACCOUNT.account_number && COMPANY_ACCOUNT.ifsc) {
      console.log('🏢 Processing company payout...');
      
      try {
        // For simplicity, company payout can be handled separately
        // or accumulated and processed in batches
        
        const companyPayoutData = {
          // Company fund account should be pre-configured
          amount: companyAmount,
          referenceId: generatePayoutReference(payoutData.bookingId, 'company'),
          purpose: 'payout',
          narration: `Carelook company commission for booking ${payoutData.bookingId}`
        };
        
        // Note: Company payout implementation can be customized based on business needs
        console.log('💼 Company payout prepared:', companyPayoutData);
        
        logPayoutActivity('company_payout_prepared', companyPayoutData);
        companyPayoutResult = { success: true, message: 'Company payout prepared' };
        
      } catch (error) {
        console.error('❌ Company payout error:', error);
        companyPayoutResult = { success: false, error: error.message };
        
        logPayoutActivity('company_payout_failed', {
          bookingId: payoutData.bookingId,
          error: error.message
        }, 'error');
      }
    }
    
    await client.query('COMMIT');
    
    const response = {
      success: true,
      message: 'Payout split processed successfully',
      data: {
        bookingId: payoutData.bookingId,
        totalAmount,
        vendorAmount,
        companyAmount,
        vendorTransferId: vendorPayoutResult?.success ? vendorPayoutResult.payout.id : null,
        companyTransferId: companyPayoutResult?.success ? 'company_processed' : null,
        status: vendorPayoutResult?.success ? 'processing' : 'pending',
        settlementDate: vendorPayoutResult?.success ? new Date().toISOString() : null
      }
    };
    
    console.log('✅ Payout split completed successfully:', response.data);
    logPayoutActivity('payout_split_completed', response.data);
    
    return response;
    
  } catch (error) {
    await client.query('ROLLBACK');
    
    console.error('❌ Payout split error:', error);
    logPayoutActivity('payout_split_failed', {
      bookingId: payoutData.bookingId,
      error: error.message
    }, 'error');
    
    return {
      success: false,
      error: error.message || 'Payout processing failed',
      data: {
        bookingId: payoutData.bookingId,
        status: 'failed'
      }
    };
    
  } finally {
    client.release();
  }
};

/**
 * Get vendor earnings summary
 */
const getVendorEarnings = async (vendorId) => {
  try {
    console.log('📊 Fetching vendor earnings for:', vendorId);
    
    // First check if vendor has bank details and KYC setup
    const bankDetailsQuery = `
      SELECT 
        account_number, ifsc_code, account_holder_name, bank_name,
        razorpay_contact_id, razorpay_fund_account_id,
        bank_details_verified, razorpay_fund_account_status
      FROM registration_and_other_details 
      WHERE sr_no = $1
    `;
    
    const bankDetailsResult = await query(bankDetailsQuery, [vendorId]);
    const bankDetails = bankDetailsResult.rows[0];
    
    // Check if bank details are complete
    const hasBankDetails = bankDetails && 
      bankDetails.account_number && 
      bankDetails.ifsc_code && 
      bankDetails.account_holder_name;
    
    const hasRazorpaySetup = bankDetails && 
      bankDetails.razorpay_contact_id && 
      bankDetails.razorpay_fund_account_id;
    
    const earningsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed_bookings,
        COALESCE(SUM(CASE WHEN payout_status = 'completed' THEN vendor_amount ELSE 0 END), 0) as settled_amount,
        COALESCE(SUM(CASE WHEN payout_status = 'processing' THEN vendor_amount ELSE 0 END), 0) as processing_amount,
        COALESCE(SUM(CASE WHEN payout_status = 'pending' AND booking_status = 'completed' THEN vendor_amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN booking_status = 'completed' AND vendor_amount IS NOT NULL THEN vendor_amount ELSE 0 END), 0) as total_earnings,
        COALESCE(SUM(CASE 
          WHEN booking_status = 'completed' 
          AND DATE(payout_created_at) = CURRENT_DATE 
          AND vendor_amount IS NOT NULL
          THEN vendor_amount ELSE 0 
        END), 0) as today_earnings,
        COALESCE(SUM(CASE 
          WHEN booking_status = 'completed' 
          AND payout_created_at >= CURRENT_DATE - INTERVAL '7 days' 
          AND vendor_amount IS NOT NULL
          THEN vendor_amount ELSE 0 
        END), 0) as week_earnings,
        COALESCE(SUM(CASE 
          WHEN booking_status = 'completed' 
          AND payout_created_at >= CURRENT_DATE - INTERVAL '30 days' 
          AND vendor_amount IS NOT NULL
          THEN vendor_amount ELSE 0 
        END), 0) as month_earnings
      FROM booking_all_details_of_user_to_vendor 
      WHERE vendor_id = $1 OR assigned_vendor_id = $1
    `;
    
    const result = await query(earningsQuery, [vendorId]);
    const earnings = result.rows[0];
    
    // Get recent transactions
    const transactionsQuery = `
      SELECT 
        booking_id, user_name, services_booked, total_amount, vendor_amount,
        payout_status, payout_id, payout_reference, payout_date,
        payout_created_at, company_commission, final_amount
      FROM booking_all_details_of_user_to_vendor 
      WHERE (vendor_id = $1 OR assigned_vendor_id = $1)
        AND booking_status = 'completed'
        AND vendor_amount IS NOT NULL
      ORDER BY payout_created_at DESC 
      LIMIT 20
    `;
    
    const transactionsResult = await query(transactionsQuery, [vendorId]);
    
    const recentTransactions = transactionsResult.rows.map(row => ({
      bookingId: row.booking_id,
      customerName: row.user_name,
      serviceName: row.services_booked ? 
        (typeof row.services_booked === 'string' ? 
          JSON.parse(row.services_booked)[0]?.name : 
          row.services_booked[0]?.name) : 
        (row.service_type || 'Service'),
      amount: parseFloat(row.total_amount || 0),
      finalAmount: parseFloat(row.final_amount || 0),
      vendorAmount: parseFloat(row.vendor_amount || 0),
      companyCommission: parseFloat(row.company_commission || 0),
      status: row.payout_status || 'pending',
      payoutId: row.payout_id,
      payoutReference: row.payout_reference,
      payoutDate: row.payout_date,
      createdAt: row.payout_created_at
    }));
    
    // If no bank details, show appropriate message
    if (!hasBankDetails || !hasRazorpaySetup) {
      const response = {
        success: true,
        data: {
          totalEarnings: parseFloat(earnings.total_earnings),
          settledAmount: parseFloat(earnings.settled_amount),
          processingAmount: parseFloat(earnings.processing_amount),
          pendingAmount: parseFloat(earnings.pending_amount),
          todayEarnings: parseFloat(earnings.today_earnings),
          thisWeekEarnings: parseFloat(earnings.week_earnings),
          thisMonthEarnings: parseFloat(earnings.month_earnings),
          recentTransactions,
          hasCompleteBankDetails: hasBankDetails,
          hasRazorpaySetup: hasRazorpaySetup,
          message: !hasBankDetails ? 
            "No data yet - Please complete your bank details and KYC verification to see earnings" :
            "No data yet - Bank details verification is in progress"
        }
      };
      
      console.log('⚠️ Vendor earnings - incomplete bank setup');
      return response;
    }

    const response = {
      success: true,
      data: {
        totalEarnings: parseFloat(earnings.total_earnings),
        settledAmount: parseFloat(earnings.settled_amount),
        processingAmount: parseFloat(earnings.processing_amount),
        pendingAmount: parseFloat(earnings.pending_amount),
        todayEarnings: parseFloat(earnings.today_earnings),
        thisWeekEarnings: parseFloat(earnings.week_earnings),
        thisMonthEarnings: parseFloat(earnings.month_earnings),
        recentTransactions,
        hasCompleteBankDetails: true,
        hasRazorpaySetup: true,
        message: recentTransactions.length === 0 ? 
          "No transactions yet - Complete bookings will appear here" : null
      }
    };
    
    console.log('✅ Vendor earnings fetched successfully');
    return response;
    
  } catch (error) {
    console.error('❌ Error fetching vendor earnings:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch vendor earnings'
    };
  }
};

/**
 * Get payout transactions for a vendor
 */
const getPayoutTransactions = async (vendorId, limit = 20, offset = 0) => {
  try {
    console.log('📋 Fetching payout transactions for vendor:', vendorId);
    
    // First check if vendor has bank details setup
    const bankDetailsQuery = `
      SELECT 
        account_number, ifsc_code, account_holder_name,
        razorpay_contact_id, razorpay_fund_account_id,
        bank_details_verified
      FROM registration_and_other_details 
      WHERE sr_no = $1
    `;
    
    const bankDetailsResult = await query(bankDetailsQuery, [vendorId]);
    const bankDetails = bankDetailsResult.rows[0];
    
    const hasBankDetails = bankDetails && 
      bankDetails.account_number && 
      bankDetails.ifsc_code && 
      bankDetails.account_holder_name;
    
    const transactionQuery = `
      SELECT 
        booking_id, user_name, service_type, total_amount, vendor_amount,
        payout_status, payout_id, payout_reference, payout_date,
        payout_created_at, payout_failure_reason
      FROM booking_all_details_of_user_to_vendor 
      WHERE assigned_vendor_id = $1 
        AND booking_status = 'completed'
        AND vendor_amount IS NOT NULL
      ORDER BY payout_created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await query(transactionQuery, [vendorId, limit, offset]);
    
    const transactions = result.rows.map(row => ({
      bookingId: row.booking_id,
      customerName: row.user_name,
      serviceName: row.service_type,
      amount: parseFloat(row.total_amount),
      vendorAmount: parseFloat(row.vendor_amount),
      status: row.payout_status,
      paymentId: row.payout_id,
      transferId: row.payout_reference,
      settlementDate: row.payout_date,
      createdAt: row.payout_created_at,
      errorCode: row.payout_failure_reason,
      errorDescription: row.payout_failure_reason
    }));
    
    // If no bank details or no transactions, show appropriate message
    if (!hasBankDetails) {
      console.log('⚠️ Payout transactions - no bank details');
      return {
        success: true,
        data: [],
        message: "No data yet - Please complete your bank details and KYC verification to see payout transactions",
        hasCompleteBankDetails: false
      };
    }

    if (transactions.length === 0) {
      console.log('⚠️ Payout transactions - no completed bookings');
      return {
        success: true,
        data: [],
        message: "No payout transactions yet - Complete bookings will appear here once processed",
        hasCompleteBankDetails: true
      };
    }

    console.log('✅ Payout transactions fetched successfully');
    return {
      success: true,
      data: transactions,
      hasCompleteBankDetails: true,
      totalTransactions: transactions.length
    };
    
  } catch (error) {
    console.error('❌ Error fetching payout transactions:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch payout transactions'
    };
  }
};

/**
 * Retry failed payout
 */
const retryFailedPayout = async (bookingId, vendorId) => {
  try {
    console.log('🔄 Retrying failed payout for booking:', bookingId);
    
    // Get booking details
    const bookingQuery = `
      SELECT id, vendor_settlement_status, vendor_last_payout_retry
      FROM booking_all_details_of_user_to_vendor 
      WHERE booking_id = $1 AND assigned_vendor_id = $2
    `;
    
    const result = await query(bookingQuery, [bookingId, vendorId]);
    
    if (result.rows.length === 0) {
      throw new Error('Booking not found or not assigned to this vendor');
    }
    
    const booking = result.rows[0];
    
    if (booking.vendor_settlement_status !== 'failed') {
      throw new Error(`Cannot retry payout with status: ${booking.vendor_settlement_status}`);
    }
    
    // Check retry cooldown (30 minutes)
    const lastRetry = booking.vendor_last_payout_retry;
    const now = new Date();
    const cooldownPeriod = 30 * 60 * 1000; // 30 minutes
    
    if (lastRetry && (now - new Date(lastRetry)) < cooldownPeriod) {
      const remainingTime = Math.ceil((cooldownPeriod - (now - new Date(lastRetry))) / 60000);
      throw new Error(`Please wait ${remainingTime} minutes before retrying`);
    }
    
    // Update retry timestamp
    await query(
      'UPDATE booking_all_details_of_user_to_vendor SET vendor_last_payout_retry = CURRENT_TIMESTAMP WHERE id = $1',
      [booking.id]
    );
    
    // Retry payout by calling the main payout processing function
    const retryResult = await processPayoutSplit({ bookingId });
    
    logPayoutActivity('payout_retry_attempted', {
      bookingId,
      vendorId,
      result: retryResult.success
    });
    
    return retryResult;
    
  } catch (error) {
    console.error('❌ Error retrying payout:', error);
    return {
      success: false,
      error: error.message || 'Failed to retry payout'
    };
  }
};

/**
 * Update payout status from webhook
 */
const updatePayoutStatusFromWebhook = async (payoutId, status, webhookData) => {
  try {
    console.log('🔔 Updating payout status from webhook:', { payoutId, status });
    
    const mappedStatus = mapPayoutStatus(status);
    const settlementDate = mappedStatus === 'settled' ? new Date() : null;
    
    const updateQuery = `
      UPDATE booking_all_details_of_user_to_vendor 
      SET 
        vendor_settlement_status = $1,
        vendor_settlement_date = $2
      WHERE vendor_razorpay_transfer_id_vendor = $3
      RETURNING booking_id, assigned_vendor_id
    `;
    
    const result = await query(updateQuery, [mappedStatus, settlementDate, payoutId]);
    
    if (result.rows.length > 0) {
      const booking = result.rows[0];
      
      logPayoutActivity('payout_status_updated', {
        bookingId: booking.booking_id,
        vendorId: booking.assigned_vendor_id,
        payoutId,
        oldStatus: webhookData.oldStatus,
        newStatus: mappedStatus
      });
      
      console.log('✅ Payout status updated successfully');
      return { success: true, booking };
    } else {
      console.log('⚠️ No booking found for payout ID:', payoutId);
      return { success: false, error: 'Booking not found for payout ID' };
    }
    
  } catch (error) {
    console.error('❌ Error updating payout status from webhook:', error);
    return {
      success: false,
      error: error.message || 'Failed to update payout status'
    };
  }
};

module.exports = {
  processPayoutSplit,
  getVendorEarnings,
  getPayoutTransactions,
  retryFailedPayout,
  updatePayoutStatusFromWebhook
};