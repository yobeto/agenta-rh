FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy only backend requirements
COPY backend/requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend application code ONLY
COPY backend /app

# Expose port
ENV PORT=8000
EXPOSE 8000

# Run the application (Render will replace $PORT automatically)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
