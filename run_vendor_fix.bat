@echo off
echo ==============================================
echo    FIXING VENDOR MATCHING ISSUE
echo ==============================================
echo.

echo Step 1: Running SQL fix script...
echo.
psql -U postgres -d muadatabase -f fix_vendor_data.sql

echo.
echo ==============================================
echo Step 2: Testing vendor matching...
echo.
node test_vendor_matching.js

echo.
echo ==============================================
echo If you see "Found X matching vendors" above, 
echo the fix worked! If not, check the database
echo connection and make sure PostgreSQL is running.
echo ==============================================
pause 