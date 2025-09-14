# Use Node 18 slim as base
FROM node:18-slim

# Install Python + venv + other system deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 python3-pip python3-venv ca-certificates gnupg && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Node package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy Python service
COPY sentiment_service.py ./

# Set up Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip inside venv and install Python deps
RUN pip install --upgrade pip
RUN pip install torch transformers pandas

# Copy only necessary files (excluding .env)
COPY . .

# Set default port for Cloud Run
ENV PORT=8080
EXPOSE 8080

# Start the Node server
CMD ["node", "server.js"]