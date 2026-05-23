from PIL import Image, ImageOps

def check_right_half_pure():
    img_path = "public/assets/signs/page_70.png"
    img = Image.open(img_path)
    w, h = img.size
    
    # Crop the right half
    right_half = img.crop((w // 2, 0, w, h))
    
    # Convert to grayscale and invert so white becomes black
    gray = ImageOps.grayscale(right_half)
    # Threshold slightly to filter out compression noise
    # We want any pixel less than 240 in grayscale (non-white) to become 255 in inverted, and others 0
    thresh = gray.point(lambda p: 255 if p < 240 else 0)
    
    bbox = thresh.getbbox()
    
    if bbox:
        x0, y0, x1, y1 = bbox
        abs_x0 = x0 + w // 2
        abs_x1 = x1 + w // 2
        print(f"Content found on right half! Bounding box: x0={abs_x0}, y0={y0}, x1={abs_x1}, y1={y1}")
        
        # Save cropped content with a 10px padding
        cropped = img.crop((max(0, abs_x0 - 10), max(0, y0 - 10), min(w, abs_x1 + 10), min(h, y1 + 10)))
        cropped.save("public/assets/signs/right_half_content.png")
        print("Successfully saved cropped right half content to public/assets/signs/right_half_content.png")
    else:
        print("The right half of the page is completely empty/white!")

if __name__ == "__main__":
    check_right_half_pure()
