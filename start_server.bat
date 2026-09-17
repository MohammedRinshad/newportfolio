@echo off
echo Starting Portfolio Server (SSI)...
echo Opening browser to http://localhost:8000
start http://localhost:8000
python ssi_server.py 8000
pause
