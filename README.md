# Jewelry Store

A Flask-based jewelry store web application with AI-powered visual ring search.

## Features

- Visual ring search using image-based matching
- Ring catalog management with metadata and images
- Customization options for gemstones and metals
- Admin endpoints to rebuild the search catalog
- Frontend UI for browsing and searching rings

## How to run

1. Create and activate a Python virtual environment
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the backend:
   ```bash
   python backend/app.py
   ```
4. Open the site in your browser at `http://localhost:5000`

## Notes

- Add your own ring images to `backend/catalog_images/`
- Rebuild the visual search catalog using the `/api/admin/build-catalog` endpoint
