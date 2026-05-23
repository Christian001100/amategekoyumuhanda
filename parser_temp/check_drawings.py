import pdfplumber

def check_drawings():
    pdf_path = "src/data/Eric .pdf"
    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[2] # Page 3
        print(f"Page 3 rects: {len(page.rects)}")
        print(f"Page 3 lines: {len(page.lines)}")
        print(f"Page 3 curves: {len(page.curves)}")
        print(f"Page 3 images: {len(page.images)}")
        
        # Combine all drawing elements and find their bounding box
        drawings = page.rects + page.lines + page.curves
        if drawings:
            min_x = min(d.get("x0", d.get("x1", 9999)) for d in drawings)
            max_x = max(d.get("x1", d.get("x0", 0)) for d in drawings)
            min_y = min(d.get("top", d.get("bottom", 9999)) for d in drawings)
            max_y = max(d.get("bottom", d.get("top", 0)) for d in drawings)
            print(f"Drawings bounding box: x0={min_x}, y0={min_y}, x1={max_x}, y1={max_y}")
            
            # Print a few shapes
            for idx, d in enumerate(drawings[:10]):
                print(f"Shape {idx}: type={type(d)}, x0={d.get('x0')}, top={d.get('top')}, x1={d.get('x1')}, bottom={d.get('bottom')}, color={d.get('non_stroking_color') or d.get('stroking_color')}")

if __name__ == "__main__":
    check_drawings()
