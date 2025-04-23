-- Vendor Performance Metrics Table
CREATE TABLE IF NOT EXISTS vendor_performance (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL UNIQUE,
    total_revenue NUMERIC(12,2) DEFAULT 0, -- Total revenue in INR
    total_bookings INTEGER DEFAULT 0, -- Total bookings received
    completed_bookings INTEGER DEFAULT 0, -- Successfully completed bookings
    cancelled_bookings INTEGER DEFAULT 0, -- Cancelled bookings
    total_customers INTEGER DEFAULT 0, -- Unique customers served
    avg_rating NUMERIC(3,2) DEFAULT 0, -- Average rating (1-5 scale)
    total_ratings INTEGER DEFAULT 0, -- Number of ratings received
    monthly_revenue JSONB DEFAULT '{}', -- Monthly revenue breakdown
    service_distribution JSONB DEFAULT '{}', -- Service type distribution
    last_booking_date TIMESTAMP, -- Date of last booking
    busiest_day VARCHAR(10), -- Busiest day of the week
    busiest_time_slot VARCHAR(20), -- Busiest time slot
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vendor_performance FOREIGN KEY (vendor_id) REFERENCES registration_and_other_details(sr_no) ON DELETE CASCADE
);

-- Create trigger to update timestamp
DROP TRIGGER IF EXISTS update_vendor_performance_timestamp ON vendor_performance;
CREATE TRIGGER update_vendor_performance_timestamp
BEFORE UPDATE ON vendor_performance
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Create or update a function to automatically update performance metrics when a booking changes status
CREATE OR REPLACE FUNCTION update_vendor_performance()
RETURNS TRIGGER AS $$
DECLARE
    service_price NUMERIC;
    service_json JSONB;
    day_of_week TEXT;
    hour_of_day INTEGER;
    time_slot TEXT;
BEGIN
    -- Only act on status changes to 'completed' or from 'completed'
    IF (TG_OP = 'UPDATE' AND 
        (NEW.booking_status = 'completed' OR OLD.booking_status = 'completed')) THEN
        
        -- Extract price from service name (assuming it's available or calculate differently)
        BEGIN
            -- Try to get the price from vendor_single_services
            SELECT REPLACE(price, '₹', '')::NUMERIC INTO service_price
            FROM vendor_single_services 
            WHERE vendor_id = NEW.vendor_id AND name = NEW.service_name;
            
            IF service_price IS NULL THEN
                -- Default to 0 if not found
                service_price := 0;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            service_price := 0;
        END;
        
        -- If status changed to completed
        IF NEW.booking_status = 'completed' AND OLD.booking_status != 'completed' THEN
            -- Update vendor performance
            UPDATE vendor_performance
            SET 
                total_revenue = total_revenue + service_price,
                completed_bookings = completed_bookings + 1,
                
                -- Calculate busy times
                -- Extract day of week
                day_of_week = CASE EXTRACT(DOW FROM NEW.date_time)
                    WHEN 0 THEN 'Sunday'
                    WHEN 1 THEN 'Monday'
                    WHEN 2 THEN 'Tuesday'
                    WHEN 3 THEN 'Wednesday'
                    WHEN 4 THEN 'Thursday'
                    WHEN 5 THEN 'Friday'
                    WHEN 6 THEN 'Saturday'
                END,
                
                -- Update last booking date
                last_booking_date = GREATEST(last_booking_date, NEW.date_time)
            WHERE vendor_id = NEW.vendor_id;
            
            -- Count unique customers (simplified approach)
            UPDATE vendor_performance
            SET total_customers = (
                SELECT COUNT(DISTINCT customer_name) 
                FROM vendor_bookings 
                WHERE vendor_id = NEW.vendor_id AND booking_status = 'completed'
            )
            WHERE vendor_id = NEW.vendor_id;
            
        -- If status changed from completed to something else
        ELSIF OLD.booking_status = 'completed' AND NEW.booking_status != 'completed' THEN
            -- Reverse the updates
            UPDATE vendor_performance
            SET 
                total_revenue = GREATEST(0, total_revenue - service_price),
                completed_bookings = GREATEST(0, completed_bookings - 1)
            WHERE vendor_id = NEW.vendor_id;
            
            -- Recalculate unique customers
            UPDATE vendor_performance
            SET total_customers = (
                SELECT COUNT(DISTINCT customer_name) 
                FROM vendor_bookings 
                WHERE vendor_id = NEW.vendor_id AND booking_status = 'completed'
            )
            WHERE vendor_id = NEW.vendor_id;
        END IF;
    END IF;
    
    -- For all booking updates, update total_bookings
    IF (TG_OP = 'INSERT') THEN
        -- If this is a new record, increment total_bookings
        UPDATE vendor_performance
        SET total_bookings = total_bookings + 1
        WHERE vendor_id = NEW.vendor_id;
        
        -- Create entry if it doesn't exist
        IF NOT FOUND THEN
            INSERT INTO vendor_performance (vendor_id, total_bookings)
            VALUES (NEW.vendor_id, 1);
        END IF;
    END IF;
    
    -- Update cancelled bookings count
    IF (TG_OP = 'UPDATE' AND NEW.booking_status = 'denied' AND OLD.booking_status != 'denied') THEN
        UPDATE vendor_performance
        SET cancelled_bookings = cancelled_bookings + 1
        WHERE vendor_id = NEW.vendor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update performance metrics when bookings change
DROP TRIGGER IF EXISTS update_performance_on_booking_change ON vendor_bookings;
CREATE TRIGGER update_performance_on_booking_change
AFTER INSERT OR UPDATE OF booking_status ON vendor_bookings
FOR EACH ROW
EXECUTE PROCEDURE update_vendor_performance();

-- Create a function to calculate service distribution
CREATE OR REPLACE FUNCTION calculate_service_distribution(vendor_id_param INTEGER)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_object_agg(service_type, count)
    INTO result
    FROM (
        SELECT service_type, COUNT(*) as count
        FROM vendor_bookings
        WHERE vendor_id = vendor_id_param AND booking_status = 'completed'
        GROUP BY service_type
    ) as service_counts;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate monthly revenue
CREATE OR REPLACE FUNCTION calculate_monthly_revenue(vendor_id_param INTEGER)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    -- Calculate monthly revenue for current year
    SELECT jsonb_object_agg(month_name, revenue)
    INTO result
    FROM (
        SELECT 
            TO_CHAR(date_time, 'Month') as month_name, 
            SUM(COALESCE(
                (SELECT REPLACE(price, '₹', '')::NUMERIC 
                FROM vendor_single_services 
                WHERE vendor_id = vb.vendor_id AND name = vb.service_name), 
                0
            )) as revenue
        FROM vendor_bookings vb
        WHERE 
            vendor_id = vendor_id_param 
            AND booking_status = 'completed'
            AND EXTRACT(YEAR FROM date_time) = current_year
        GROUP BY month_name
        ORDER BY MIN(EXTRACT(MONTH FROM date_time))
    ) as monthly_revenue;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Procedure to refresh all vendor performance metrics
CREATE OR REPLACE PROCEDURE refresh_vendor_performance()
LANGUAGE plpgsql
AS $$
DECLARE
    v_rec RECORD;
BEGIN
    -- For each vendor
    FOR v_rec IN SELECT DISTINCT vendor_id FROM vendor_bookings LOOP
        -- Calculate service distribution
        UPDATE vendor_performance
        SET service_distribution = calculate_service_distribution(v_rec.vendor_id)
        WHERE vendor_id = v_rec.vendor_id;
        
        -- Calculate monthly revenue
        UPDATE vendor_performance
        SET monthly_revenue = calculate_monthly_revenue(v_rec.vendor_id)
        WHERE vendor_id = v_rec.vendor_id;
        
        -- Calculate busiest day (simplified)
        UPDATE vendor_performance
        SET busiest_day = subq.busiest_day
        FROM (
            SELECT 
                CASE EXTRACT(DOW FROM date_time)
                    WHEN 0 THEN 'Sunday'
                    WHEN 1 THEN 'Monday'
                    WHEN 2 THEN 'Tuesday'
                    WHEN 3 THEN 'Wednesday'
                    WHEN 4 THEN 'Thursday'
                    WHEN 5 THEN 'Friday'
                    WHEN 6 THEN 'Saturday'
                END as busiest_day
            FROM vendor_bookings
            WHERE vendor_id = v_rec.vendor_id AND booking_status = 'completed'
            GROUP BY busiest_day
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as subq
        WHERE vendor_id = v_rec.vendor_id;
        
        -- Calculate busiest time slot
        UPDATE vendor_performance
        SET busiest_time_slot = subq.busiest_time_slot
        FROM (
            SELECT 
                CASE 
                    WHEN EXTRACT(HOUR FROM date_time) BETWEEN 6 AND 11 THEN 'Morning'
                    WHEN EXTRACT(HOUR FROM date_time) BETWEEN 12 AND 16 THEN 'Afternoon'
                    WHEN EXTRACT(HOUR FROM date_time) BETWEEN 17 AND 20 THEN 'Evening'
                    ELSE 'Night'
                END as busiest_time_slot
            FROM vendor_bookings
            WHERE vendor_id = v_rec.vendor_id AND booking_status = 'completed'
            GROUP BY busiest_time_slot
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as subq
        WHERE vendor_id = v_rec.vendor_id;
    END LOOP;
END;
$$; 