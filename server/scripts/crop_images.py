import json
import os
from PIL import Image

def process_images():
    json_path = 'physics_newton.json'
    artifact_dir = r'C:\Users\YASH\.gemini\antigravity\brain\2bcbbcb8-f4aa-4530-bb8a-0b9ea367a5e5'
    output_dir = r'e:\QP\qpg-app\client\public\images\physics\newton'
    
    os.makedirs(output_dir, exist_ok=True)
    
    with open(json_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
        
    for q in questions:
        if 'diagramSourceImage' in q and 'diagramCrop' in q:
            img_path = os.path.join(artifact_dir, q['diagramSourceImage'])
            if os.path.exists(img_path):
                try:
                    img = Image.open(img_path)
                    # crop box: (left, upper, right, lower)
                    crop_box = q['diagramCrop']
                    
                    # My estimated crop box was [left, top, right, bottom] in absolute pixels if image is 1000x1000.
                    # Let's dynamically adjust if image width is different from 1000.
                    w, h = img.size
                    scale_x = w / 1000.0
                    scale_y = h / 1000.0
                    
                    # Actually, let's just use the crop_box directly assuming 1000x1000
                    box = (
                        int(crop_box[0] * scale_x),
                        int(crop_box[1] * scale_y),
                        int(crop_box[2] * scale_x),
                        int(crop_box[3] * scale_y)
                    )
                    cropped = img.crop(box)
                    out_filename = f"{q['questionId']}.png"
                    out_path = os.path.join(output_dir, out_filename)
                    cropped.save(out_path)
                    q['imageUrl'] = f"/images/physics/newton/{out_filename}"
                    print(f"Saved {out_path}")
                except Exception as e:
                    print(f"Error processing {img_path}: {e}")
            else:
                print(f"File not found: {img_path}")
            
            # Clean up temporary fields
            del q['diagramSourceImage']
            del q['diagramCrop']
            
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=4)
        
if __name__ == '__main__':
    process_images()
