import cv2
import numpy as np
import json
import os

def smart_crop():
    json_path = 'physics_ac.json'
    artifact_dir = r'C:\Users\YASH\.gemini\antigravity\brain\2bcbbcb8-f4aa-4530-bb8a-0b9ea367a5e5'
    output_dir = r'e:\QP\qpg-app\client\public\images\physics\ac'
    
    os.makedirs(output_dir, exist_ok=True)
    
    with open(json_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
        
    for q in questions:
        if 'diagramSourceImage' in q and 'diagramCrop' in q:
            img_path = os.path.join(artifact_dir, q['diagramSourceImage'])
            if os.path.exists(img_path):
                img = cv2.imread(img_path)
                if img is None: continue
                
                box = q['diagramCrop']
                h, w = img.shape[:2]
                
                x1 = max(0, int(box[0] * w / 1000.0) - 20)
                y1 = max(0, int(box[1] * h / 1000.0) - 20)
                x2 = min(w, int(box[2] * w / 1000.0) + 20)
                y2 = min(h, int(box[3] * h / 1000.0) + 20)
                
                # Crop to rough box
                rough_crop = img[y1:y2, x1:x2]
                
                # Convert to grayscale
                gray = cv2.cvtColor(rough_crop, cv2.COLOR_BGR2GRAY)
                
                # Threshold
                _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
                
                # Find contours
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                # Filter contours (ignore small text, keep large diagrams)
                valid_contours = []
                for cnt in contours:
                    x, y, cw, ch = cv2.boundingRect(cnt)
                    # Text characters are typically < 20x20. We keep anything larger.
                    if cw > 25 or ch > 25:
                        valid_contours.append(cnt)
                
                if valid_contours:
                    # Get bounding box of all valid contours
                    min_x, min_y = x2, y2
                    max_x, max_y = 0, 0
                    for cnt in valid_contours:
                        x, y, cw, ch = cv2.boundingRect(cnt)
                        min_x = min(min_x, x)
                        min_y = min(min_y, y)
                        max_x = max(max_x, x + cw)
                        max_y = max(max_y, y + ch)
                    
                    # Add a small padding
                    pad = 10
                    final_x1 = max(0, min_x - pad)
                    final_y1 = max(0, min_y - pad)
                    final_x2 = min(rough_crop.shape[1], max_x + pad)
                    final_y2 = min(rough_crop.shape[0], max_y + pad)
                    
                    final_crop = rough_crop[final_y1:final_y2, final_x1:final_x2]
                else:
                    # Fallback to rough crop if no large contours found
                    final_crop = rough_crop
                
                out_filename = f"{q['questionId']}.png"
                out_path = os.path.join(output_dir, out_filename)
                cv2.imwrite(out_path, final_crop)
                print(f"Smart cropped and saved {out_path}")

if __name__ == '__main__':
    smart_crop()
