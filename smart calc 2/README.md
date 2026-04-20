Quick start

- Start the frontend dev server (this opens your default browser):

```powershell
npm run dev
```

- The app serves at: http://localhost:5173/

Important: do NOT open the `index.html` via the VS Code webview or `file://` protocol. The frontend must be loaded from the HTTP dev server in a regular browser tab. Loading the page from VS Code's webview or from a file URL will cause "Domains, protocols and ports must match" errors when the page attempts to load resources or call APIs.

If you want the frontend to call the Python backend, run the backend demo or a small HTTP wrapper. Example to run the backend demo:

```powershell
python -m backend.run_demo
```

Easier options on Windows

- Run the bundled PowerShell helper (uses workspace venv if present):

```powershell
.\run_backend.ps1
```

- Or use the npm helper which calls the workspace venv Python directly:

```powershell
npm run backend:demo
```

If you want, I can add a small FastAPI wrapper that exposes `/evaluate`, `/explain`, and `/plot` (with CORS enabled) so the frontend can call the backend directly.
