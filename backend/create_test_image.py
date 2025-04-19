import cv2
import numpy as np

# Create a blank image
img = np.zeros((300, 300, 3), dtype=np.uint8)
img.fill(255)  # Make it white

# Draw a simple face
cv2.circle(img, (150, 150), 100, (0, 0, 0), 2)  # Head
cv2.circle(img, (110, 120), 15, (0, 0, 0), -1)  # Left eye
cv2.circle(img, (190, 120), 15, (0, 0, 0), -1)  # Right eye
cv2.ellipse(img, (150, 180), (50, 20), 0, 0, 180, (0, 0, 0), 2)  # Smile

# Save the image
cv2.imwrite("test.jpg", img)
print("Test image created: test.jpg") 