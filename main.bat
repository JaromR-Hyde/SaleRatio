@echo off
REM ============================================================
REM  ACTIVATE VENV, RUN PYTHON SCRIPT, THEN DEACTIVATE
REM ============================================================


if not exist venv (
    echo Creating virtual environment...
    py -m venv venv
)


echo.
echo === ACTIVATING VIRTUAL ENVIRONMENT ===
call venv\Scripts\activate.bat


echo Installing dependencies...
pip install -r requirements.txt

echo.
echo === RUNNING PYTHON SCRIPT ===
python main.py

echo.
echo === DEACTIVATING VENV ===
call deactivate

echo.
echo === DONE ===
pause


@echo off
setlocal