-- V2__add_performance_indexes.sql
-- Performance indexes for booking overlap prevention, room searches, and review lookups

-- 1. Bookings lookup and overlap indexes
CREATE INDEX IF NOT EXISTS idx_bookings_room_dates_status
    ON bookings (room_id, status, check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id
    ON bookings (user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_status
    ON bookings (status);

-- 2. Rooms inventory and search indexes
CREATE INDEX IF NOT EXISTS idx_rooms_room_number
    ON rooms (room_number);

CREATE INDEX IF NOT EXISTS idx_rooms_availability_search
    ON rooms (available, room_type, capacity, price_per_night);

-- 3. Reviews lookup indexes
CREATE INDEX IF NOT EXISTS idx_reviews_room_id
    ON reviews (room_id);

CREATE INDEX IF NOT EXISTS idx_reviews_booking_id
    ON reviews (booking_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user_room
    ON reviews (user_id, room_id);

-- 4. Email notifications retry queue index
CREATE INDEX IF NOT EXISTS idx_email_notifications_status_retry
    ON email_notifications (status, next_retry_at);
