import os
import pdfplumber
import pypdfium2 as pdfium
from PIL import Image

def extract_all_images():
    pdf_path = "src/data/Eric .pdf"
    output_dir = "parser_temp/extracted_images"
    os.makedirs(output_dir, exist_ok=True)
    
    print("Opening PDF with pdfplumber...")
    pdf = pdfplumber.open(pdf_path)
    
    print("Opening PDF with pypdfium2...")
    doc = pdfium.PdfDocument(pdf_path)
    
    total_images_saved = 0
    
    for page_idx, page in enumerate(pdf.pages):
        page_num = page.page_number
        images = page.images
        
        if not images:
            continue
            
        print(f"Page {page_num} has {len(images)} image objects. Rendering page...")
        
        # Render the page to a high-DPI image
        page_render = doc[page_idx]
        scale = 3 # 3x scale is approx 216 DPI (high quality)
        bitmap = page_render.render(scale=scale)
        pil_page = bitmap.to_pil()
        w_page, h_page = pil_page.size
        
        for img_idx, img in enumerate(images):
            # Coordinates in PDF points (72 points = 1 inch)
            x0 = img["x0"]
            y0 = img["top"]
            x1 = img["x1"]
            y1 = img["bottom"]
            
            # Map coordinates to rendered PNG space (scale by 3)
            left = max(0, int(x0 * scale) - 5)
            top = max(0, int(y0 * scale) - 5)
            right = min(w_page, int(x1 * scale) + 5)
            bottom = min(h_page, int(y1 * scale) + 5)
            
            # Crop the image region
            cropped_img = pil_page.crop((left, top, right, bottom))
            
            # Save the cropped image
            filename = f"page_{page_num}_img_{img_idx}.png"
            filepath = os.path.join(output_dir, filename)
            cropped_img.save(filepath)
            total_images_saved += 1
            
    print(f"Extraction complete! Successfully saved {total_images_saved} images to {output_dir}")

if __name__ == "__main__":
    extract_all_images()
