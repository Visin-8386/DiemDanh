import requests

def test_ai_health_endpoint():
    """
    Verify that the Nginx reverse proxy correctly forwards /ai/health requests
    to the Python FastAPI AI service, and the service is fully healthy.
    """
    url = "http://localhost/ai/health"
    try:
      response = requests.get(url, timeout=5)
      assert response.status_code == 200
      data = response.json()
      assert data["status"] == "healthy"
      assert data["face_engine_ready"] is True
      assert "InsightFace" in data["model"]
      print("\n✅ AI Microservice health check passed successfully!")
    except requests.exceptions.RequestException as e:
      assert False, f"Failed to connect to AI health endpoint: {e}"

if __name__ == "__main__":
    test_ai_health_endpoint()
