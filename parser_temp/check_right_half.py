from PIL import Image
import numpy as np

def check_right_half():
    img_path = "public/assets/signs/page_70.png"
    img = Image.open(img_path)
    w, h = img.size
    
    # Convert right half of the image to numpy array
    # Page background is usually white (255, 255, 255)
    right_half = img.crop((w // 2, 0, w, h))
    arr = np.array(right_half)
    
    # Count pixels that are not white (we allow some tolerance, e.g., sum of channels < 750)
    non_white_pixels = np.sum(np.sum(arr, axis=2) < 760)
    print(f"Right half width={w // 2}, height={h}")
    print(f"Number of non-white pixels in right half: {non_white_pixels}")
    
    # If there are non-white pixels, let's find the bounding box of non-white content on the right half!
    if non_white_pixels > 0:
        # Find indices of non-white pixels
        rows, cols = np.where(np.sum(arr, axis=2) < 760)
        min_r, max_r = np.min(rows), np.max(rows)
        min_c, max_c = np.min(cols) + (w // 2), np.max(cols) + (w // 2)
        print(f"Bounding box of content in right half: x0={min_c}, y0={min_r}, x1={max_c}, y1={max_r}")
        
        # Save a cropped version of this content to inspect it
        cropped = img.crop((min_c - 10, min_r - 10, max_c + 10, max_r + 10))
        cropped.save("public/assets/signs/right_half_content.png")
        print("Saved cropped right half content to public/assets/signs/right_half_content.png")

if __name__ == "__main__":
    check_right_half()
