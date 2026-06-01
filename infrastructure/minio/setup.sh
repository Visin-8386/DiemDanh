#!/bin/bash
# ─────────────────────────────────────────
# MinIO Setup Script
# DiemDanh – Face Recognition Attendance System
# Runs once after MinIO container is healthy
# ─────────────────────────────────────────

set -e

MINIO_ALIAS="diemdanh"
MINIO_HOST="${MINIO_ENDPOINT:-minio}"
MINIO_PORT="${MINIO_PORT:-9000}"
MINIO_URL="http://${MINIO_HOST}:${MINIO_PORT}"
BUCKET="${MINIO_BUCKET:-diemdanh-photos}"
ACCESS_KEY="${MINIO_ROOT_USER:-minioadmin}"
SECRET_KEY="${MINIO_ROOT_PASSWORD:-MinioPass@2024}"

echo "================================================"
echo " DiemDanh – MinIO Setup"
echo "================================================"
echo " Endpoint : ${MINIO_URL}"
echo " Bucket   : ${BUCKET}"
echo "================================================"

# ─────────────────────────────────────────
# 1. Wait for MinIO to be ready
# ─────────────────────────────────────────
echo "[1/4] Waiting for MinIO to be ready..."
MAX_RETRIES=30
RETRY_INTERVAL=2
COUNT=0

until curl -sf "${MINIO_URL}/minio/health/live" > /dev/null 2>&1; do
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "ERROR: MinIO did not become ready after $((MAX_RETRIES * RETRY_INTERVAL)) seconds."
        exit 1
    fi
    echo "  Attempt ${COUNT}/${MAX_RETRIES} – MinIO not ready yet, retrying in ${RETRY_INTERVAL}s..."
    sleep $RETRY_INTERVAL
done

echo "  MinIO is ready."

# ─────────────────────────────────────────
# 2. Configure mc client
# ─────────────────────────────────────────
echo "[2/4] Configuring MinIO Client (mc)..."
mc alias set "${MINIO_ALIAS}" "${MINIO_URL}" "${ACCESS_KEY}" "${SECRET_KEY}"

# ─────────────────────────────────────────
# 3. Create bucket if it doesn't exist
# ─────────────────────────────────────────
echo "[3/4] Creating bucket '${BUCKET}' (if not exists)..."
if mc ls "${MINIO_ALIAS}/${BUCKET}" > /dev/null 2>&1; then
    echo "  Bucket '${BUCKET}' already exists, skipping creation."
else
    mc mb "${MINIO_ALIAS}/${BUCKET}"
    echo "  Bucket '${BUCKET}' created successfully."
fi

# ─────────────────────────────────────────
# 4. Set bucket policy (read-only for photos)
# ─────────────────────────────────────────
echo "[4/4] Setting bucket policy for '${BUCKET}'..."

# Allow anonymous GET for /photos/ prefix so face images can be served publicly.
# Sensitive enrollment images should be stored under a private prefix.
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::${BUCKET}/photos/*"]
    }
  ]
}
EOF

mc anonymous set-json /tmp/bucket-policy.json "${MINIO_ALIAS}/${BUCKET}"
echo "  Bucket policy applied: anonymous read on '${BUCKET}/photos/*'."

# ─────────────────────────────────────────
# Done
# ─────────────────────────────────────────
echo ""
echo "================================================"
echo " MinIO setup complete!"
echo " Console : http://localhost:9001"
echo " Bucket  : ${BUCKET}"
echo "================================================"
