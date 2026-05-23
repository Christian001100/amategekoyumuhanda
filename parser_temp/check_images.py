import pdfplumber

def check_images():
    pdf_path = "src/data/Eric .pdf"
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        # Check page 3 (index 2 or page number 3)
        page = pdf.pages[2] # 0-indexed page 3
        print(f"Page 3 images count: {len(page.images)}")
        for i, img in enumerate(page.images):
            print(f"Image {i}: x0={img['x0']}, y0={img['top']}, x1={img['x1']}, y1={img['bottom']}, width={img['width']}, height={img['height']}")

if __name__ == "__main__":
    check_images()
