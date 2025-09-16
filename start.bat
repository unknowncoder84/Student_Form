@echo off
title College Form System - Startup

cls
echo ================================================
echo        COLLEGE FORM SYSTEM STARTUP
echo ================================================
echo.
echo Starting the College Form System server...
echo.

REM Set environment variables (replace with your actual Supabase credentials)
set SUPABASE_URL=https://vxrwtsmbrmzujxaezwqq.supabase.co
set SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cnd0c21icm16dWp4YWV6d3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NDE3MzIsImV4cCI6MjA3MzIxNzczMn0.YSqexS5h4cxNAulIeVPZUHhK34eTfO8_0hbNY8HzLXI
set JWT_SECRET=xR+eDLqoTwFvmo6GDxbRxy+dfEMi46LIm8f1iSde8Rb6hYy44DrKggtAt0Rj/HHpi2c9U7y+LfgVYLmPY8HJtw==

REM Start the Node.js server
npm start

echo.
echo Server stopped.
echo.
pause