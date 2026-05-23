import os
import json
import shutil
import pdfplumber

def smart_map():
    pdf_path = "src/data/Eric .pdf"
    questions_json_path = "src/data/questions.json"
    extracted_dir = "parser_temp/extracted_images"
    public_dir = "public/assets/signs"
    os.makedirs(public_dir, exist_ok=True)
    
    with open(questions_json_path, "r", encoding="utf-8") as f:
        questions = json.load(f)
        
    print("Opening PDF with pdfplumber to extract coordinates...")
    pdf = pdfplumber.open(pdf_path)
    
    # Map from originalNum to question object in JSON
    q_map = {q["originalNum"]: q for q in questions}
    
    # Gather all questions by page
    questions_by_page = {}
    for q in questions:
        p = q.get("page")
        if p is not None:
            questions_by_page.setdefault(p, []).append(q)
            
    total_images = 0
    mapped_count = 0
    unmapped_images = []
    
    # Iterate page by page
    for page_idx, page in enumerate(pdf.pages):
        page_num = page.page_number
        images = page.images
        
        if not images:
            continue
            
        # Extract words on this page
        words = page.extract_words()
        if not words:
            continue
            
        # Group words into lines
        words = sorted(words, key=lambda w: (w["top"], w["x0"]))
        lines = []
        current_line = []
        current_top = words[0]["top"]
        
        for w in words:
            if abs(w["top"] - current_top) <= 3:
                current_line.append(w)
            else:
                lines.append(current_line)
                current_line = [w]
                current_top = w["top"]
        if current_line:
            lines.append(current_line)
            
        # Convert to line items with text and top/bottom
        text_lines = []
        for line_words in lines:
            line_text = " ".join([w["text"] for w in line_words])
            line_top = min([w["top"] for w in line_words])
            line_bottom = max([w["bottom"] for w in line_words])
            text_lines.append({
                "text": line_text.strip(),
                "top": line_top,
                "bottom": line_bottom
            })
            
        # Find all question blocks on this page
        q_blocks = []
        import re
        q_start_re = re.compile(r"^\s*([0-9]+)\s*[\.\s]")
        
        for i, line_item in enumerate(text_lines):
            line = line_item["text"]
            match = q_start_re.match(line)
            if match:
                q_num = int(match.group(1))
                if q_num in q_map:
                    q_blocks.append({
                        "num": q_num,
                        "top": line_item["top"],
                        "bottom": line_item["bottom"],
                        "line_idx": i
                    })
                    
        # Sort question blocks by top
        q_blocks = sorted(q_blocks, key=lambda qb: qb["top"])
        
        # Set the bottom of each question block to the top of the next question block,
        # or the bottom of the page (which is 612)
        for i in range(len(q_blocks)):
            qb = q_blocks[i]
            if i < len(q_blocks) - 1:
                qb["end_y"] = q_blocks[i+1]["top"]
            else:
                qb["end_y"] = 612 # Page height
                
        # Now match each image on this page to a question block on this page
        for img_idx, img in enumerate(images):
            img_top = img["top"]
            img_bottom = img["bottom"]
            img_y_center = (img_top + img_bottom) / 2
            
            matched_qb = None
            for qb in q_blocks:
                if qb["top"] - 10 <= img_y_center <= qb["end_y"] + 10:
                    matched_qb = qb
                    break
                    
            q_num = None
            if matched_qb:
                q_num = matched_qb["num"]
            else:
                # Fallback: check if it belongs to a spanning question from the previous page!
                # This happens when the image is at the top of the page, and no new question has started yet
                prev_page_qs = questions_by_page.get(page_num - 1, [])
                if prev_page_qs:
                    # Find the last question from the previous page
                    last_q = prev_page_qs[-1]
                    q_num = last_q["originalNum"]
                    print(f"Fallback matched: Page {page_num} Image {img_idx} at y={img_top:.1f} matched to spanning Q {q_num} from Page {page_num-1}")
            
            if q_num is not None:
                q = q_map[q_num]
                
                # Copy the cropped image
                src_filename = f"page_{page_num}_img_{img_idx}.png"
                src_path = os.path.join(extracted_dir, src_filename)
                dest_filename = f"q_{q_num}.png"
                dest_path = os.path.join(public_dir, dest_filename)
                
                if os.path.exists(src_path):
                    shutil.copy(src_path, dest_path)
                    q["hasImage"] = True
                    q["imagePath"] = f"/assets/signs/{dest_filename}"
                    mapped_count += 1
            else:
                unmapped_images.append({
                    "page": page_num,
                    "img_idx": img_idx,
                    "top": img_top,
                    "bottom": img_bottom
                })
                
    print(f"\nSmart Map complete! Successfully mapped {mapped_count} images directly by coordinates + spanning fallback!")
    print(f"Total unmapped images: {len(unmapped_images)}")
    for um in unmapped_images:
        print(f"  Unmapped Image on Page {um['page']} index {um['img_idx']}: top={um['top']}, bottom={um['bottom']}")
        
    # Save the updated questions
    unmapped_json_qs = 0
    for q in questions:
        image_name = f"q_{q['originalNum']}.png"
        image_path = os.path.join(public_dir, image_name)
        if os.path.exists(image_path):
            q["hasImage"] = True
            q["imagePath"] = f"/assets/signs/{image_name}"
        else:
            q["hasImage"] = False
            q["imagePath"] = None
            unmapped_json_qs += 1
            
    with open(questions_json_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
        
    print(f"\nFinal sync: {len(questions) - unmapped_json_qs} questions now have valid image assets under {public_dir}!")
    print(f"{unmapped_json_qs} questions have no images and will render as text-only.")

if __name__ == "__main__":
    smart_map()
