@echo off
echo Starting Portfolio Server...
echo Opening browser to http://localhost:8000
start http://localhost:8000
python -m http.server 8000
pause
