# Use a base image that has both Node.js and Python
# A popular choice is to start with Python and install Node, or vice versa.
FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl gnupg
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install Node dependencies
RUN npm install
# We also need to install backend specific dependencies if they aren't in the root package.json
# Based on your structure, you have a root package.json that runs server.js which requires backend/server.js
# But backend/ has its own package.json. Let's make sure those are installed.
RUN cd backend && npm install

# Copy Python requirements and install
# We don't have a requirements.txt yet, so we'll create one or install manually in the dockerfile
# Ideally, we should generate a requirements.txt
COPY ml_service/ ./ml_service/
RUN pip install pandas scikit-learn pymongo joblib python-dotenv

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define environment variables (These should be overridden by the deployment platform secrets)
ENV PORT=3000
ENV PYTHON_EXECUTABLE=python3

# Start the application
CMD ["npm", "start"]
