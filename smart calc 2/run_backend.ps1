$venv = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (Test-Path $venv) {
    & $venv -m backend.run_demo @args
} else {
    & python -m backend.run_demo @args
}
