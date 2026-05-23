import pdfplumber
import json
import re

def parse_pdf():
    pdf_path = "/home/el-matadol/Downloads/Eric .pdf"
    
    questions = []
    current_q = None
    last_q_num = 0
    
    q_start_re = re.compile(r"^\s*([0-9]+)\s*\.\s*(.*)$")
    # Matches option starts: e.g. "a.", "b.", "c.", "d.", "(a)", "a)", "a )", "( c)"
    choice_re = re.compile(r"^\s*\(?\s*([a-d])\s*\)?[\.\)]\s*(.*)$", re.IGNORECASE)
    
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        
        for page_idx, page in enumerate(pdf.pages):
            page_num = page.page_number
            
            # 1. Extract all green rectangles on this page
            # Green in RGB can be (0.0, 1.0, 0.0), or close to it.
            green_rects = []
            for r in page.rects:
                color = r.get("non_stroking_color")
                # Handle RGB (0, 1, 0) or similar green colors
                if color and len(color) == 3 and color[1] > 0.8 and color[0] < 0.2 and color[2] < 0.2:
                    green_rects.append({
                        "top": r["top"],
                        "bottom": r["bottom"],
                        "x0": r["x0"],
                        "x1": r["x1"]
                    })
            
            # 2. Extract words with coordinates
            # We want to reconstruct lines of text with their coordinates
            # pdfplumber allows extracting words and we can group them by their visual lines (same top coordinate, approx)
            words = page.extract_words(extra_attrs=["fontname", "size"])
            
            # Group words into lines based on their vertical top coordinate (with a tolerance of 2 pixels)
            lines = []
            if not words:
                continue
                
            # Sort words by top then x0
            words = sorted(words, key=lambda w: (w["top"], w["x0"]))
            
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
                
            # Convert lines to text strings with their bounding boxes (top, bottom)
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
                
            # 3. Parse questions and choices from the reconstructed text lines
            for line_item in text_lines:
                line = line_item["text"]
                top = line_item["top"]
                bottom = line_item["bottom"]
                
                # Skip page headers, footers, RESTRICTED
                if not line or line == "RESTRICTED" or re.match(r"^\s*[0-9]+\s*$", line):
                    continue
                    
                # Check if it is a question start
                q_match = q_start_re.match(line)
                if q_match:
                    q_num = int(q_match.group(1))
                    q_text = q_match.group(2).strip()
                    
                    # Prevent jumping backward significantly to avoid false question starts
                    if current_q is None or q_num >= last_q_num - 5:
                        if current_q:
                            questions.append(current_q)
                            
                        last_q_num = q_num
                        current_q = {
                            "originalNum": q_num,
                            "question": q_text,
                            "options": [],
                            "answer": None,
                            "hasImage": False,
                            "page": page_num
                        }
                        continue
                        
                # Check if it is a choice start
                choice_match = choice_re.match(line)
                if choice_match and current_q:
                    letter = choice_match.group(1).lower()
                    option_text = choice_match.group(2).strip()
                    
                    # Check if this choice text itself or its line coordinates overlap with any green rects
                    is_correct_by_highlight = False
                    for r in green_rects:
                        # If the green rectangle overlaps vertically with this line
                        # We use a small overlap buffer (e.g. at least 30% vertical overlap)
                        overlap = min(bottom, r["bottom"]) - max(top, r["top"])
                        if overlap > 3:
                            is_correct_by_highlight = True
                            break
                            
                    # Check if the text itself has parentheses indicating correct choice
                    is_correct_by_text = False
                    raw_line = line
                    if re.search(r"\(\s*[a-d]\s*\)", raw_line, re.IGNORECASE):
                        is_correct_by_text = True
                    # Also check for format like (c.) or (b.) or (d.)
                    if re.search(r"\(\s*[a-d]\s*\.\s*\)", raw_line, re.IGNORECASE):
                        is_correct_by_text = True
                        
                    is_correct = is_correct_by_highlight or is_correct_by_text
                    
                    # Append option
                    # If option spans multiple lines, we'll append to it later
                    current_q["options"].append({
                        "letter": letter,
                        "text": option_text,
                        "top": top,
                        "bottom": bottom,
                        "is_correct": is_correct
                    })
                    
                    if is_correct:
                        current_q["answer"] = letter
                    continue
                    
                # If it is a continuation of the question or last option
                if current_q:
                    if not current_q["options"]:
                        current_q["question"] += " " + line
                    else:
                        # Append to the last option text
                        last_opt = current_q["options"][-1]
                        last_opt["text"] += " " + line
                        last_opt["bottom"] = bottom
                        
                        # Recheck if the option block now overlaps with green highlight
                        # since its vertical bounds expanded
                        is_correct_by_highlight = False
                        for r in green_rects:
                            overlap = min(last_opt["bottom"], r["bottom"]) - max(last_opt["top"], r["top"])
                            if overlap > 3:
                                is_correct_by_highlight = True
                                break
                                
                        if is_correct_by_highlight:
                            last_opt["is_correct"] = True
                            current_q["answer"] = last_opt["letter"]
                            
    # Save the last question
    if current_q:
        questions.append(current_q)
        
    # Clean up and post-process
    # Give every question a sequential ID from 1 to N, and determine hasImage
    parsed_questions = []
    for i, q in enumerate(questions, 1):
        q["id"] = i
        
        # Deduce answer if not explicitly marked
        # We find which option has is_correct = True
        detected_ans = None
        for opt in q["options"]:
            if opt.get("is_correct"):
                detected_ans = opt["letter"]
                break
        if detected_ans:
            q["answer"] = detected_ans
            
        # Clean up temporary fields
        cleaned_options = []
        for opt in q["options"]:
            cleaned_options.append({
                "letter": opt["letter"],
                "text": opt["text"]
            })
        q["options"] = cleaned_options
        
        q_text_lower = q["question"].lower()
        has_img_word = any(w in q_text_lower for w in ["cyapa", "kimenyetso", "image", "shusho ya", "ishusho", "gihagaze nabi", "iri sangano", "[image"])
        q["hasImage"] = has_img_word
        if q["hasImage"]:
            q["imagePath"] = f"/assets/signs/q_{q['originalNum']}.png"
            
        parsed_questions.append({
            "id": q["id"],
            "originalNum": q["originalNum"],
            "question": q["question"],
            "options": q["options"],
            "answer": q["answer"],
            "hasImage": q["hasImage"],
            "imagePath": q.get("imagePath"),
            "page": q["page"]
        })
        
        # Warnings
        if len(q["options"]) != 4:
            print(f"Warning: Question ID {q['id']} (Orig {q['originalNum']}) has {len(q['options'])} options on page {q['page']}.")
        if not q["answer"]:
            print(f"Warning: Question ID {q['id']} (Orig {q['originalNum']}) has NO answer on page {q['page']}.")
            
    print(f"Successfully parsed {len(parsed_questions)} questions via pdfplumber + highlights.")
    
    with open("questions.json", "w", encoding="utf-8") as f:
        json.dump(parsed_questions, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    parse_pdf()
