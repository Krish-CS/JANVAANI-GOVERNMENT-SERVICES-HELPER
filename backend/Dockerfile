# ─── JanVaani Backend — Production Dockerfile ───
# Python image for API-based STT/TTS + cloud LLM APIs

FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -r janvaani && chown -R janvaani:janvaani /app
USER janvaani

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/api/health').raise_for_status()"

# Run with uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
