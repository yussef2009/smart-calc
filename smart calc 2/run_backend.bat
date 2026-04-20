@echo off
if exist .venv\Scripts\python.exe (
  .venv\Scripts\python.exe -m backend.run_demo %*
) else (
  python -m backend.run_demo %*
)
