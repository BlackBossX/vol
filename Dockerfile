# Node + Python base (Python for ML scripts)
FROM python:3.11-slim

# Install Node.js 20 and build essentials for native deps
RUN apt-get update \ 
    && apt-get install -y curl gnupg build-essential \ 
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \ 
    && apt-get install -y nodejs \ 
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies (root + backend)
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install && cd backend && npm install

# Install Python deps for ML
COPY ml_service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy application source and model artifacts
COPY . .

# Runtime env
ENV PORT=3000
ENV PYTHON_EXECUTABLE=python3
EXPOSE 3000

# Start application
CMD ["npm", "start"]
