FROM python:3.9-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire project
COPY . .

# Expose port
EXPOSE 7860

# Run gunicorn on port 7860 (Hugging Face Spaces default)
CMD ["gunicorn", "--chdir", "backend", "--bind", "0.0.0.0:7860", "app:app"]
