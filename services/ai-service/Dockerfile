FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV, InsightFace (needs g++ to compile Cython extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 \
    libgthread-2.0-0 wget curl \
    # C++ build tools required by insightface Cython extensions
    g++ gcc python3-dev build-essential \
    patchelf \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Upgrade pip first, then install — some packages need newer pip
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Clear the executable stack flag on onnxruntime to prevent glibc newer version loading errors
RUN patchelf --clear-execstack /usr/local/lib/python3.11/site-packages/onnxruntime/capi/onnxruntime_pybind11_state.cpython-311-x86_64-linux-gnu.so

# Create models directory (InsightFace downloads models here on first run)
RUN mkdir -p /app/models /app/uploads

COPY . .

EXPOSE 5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000", "--reload"]
