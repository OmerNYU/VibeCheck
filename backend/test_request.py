import requests

def test_mood_detection():
    # Path to a test image file
    image_path = "test.jpg"
    
    try:
        with open(image_path, "rb") as f:
            files = {"file": f}
            response = requests.post("http://localhost:8000/api/mood/detect", files=files)
            print("Status Code:", response.status_code)
            print("Response Text:", response.text)
            try:
                print("Response JSON:", response.json())
            except:
                print("Could not parse response as JSON")
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    test_mood_detection() 