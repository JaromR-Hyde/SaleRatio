@echo off
REM ============================================================
REM  ACTIVATE VENV, RUN PYTHON SCRIPT, THEN DEACTIVATE
REM ============================================================

echo.
echo === ACTIVATING VIRTUAL ENVIRONMENT ===
call venv\Scripts\activate.bat

echo.
echo === RUNNING PYTHON SCRIPT ===
python sqlTojson.py

echo.
echo === DEACTIVATING VENV ===
call deactivate

echo.
echo === DONE ===
pause
