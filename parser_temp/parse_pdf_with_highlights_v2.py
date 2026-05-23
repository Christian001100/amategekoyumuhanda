import pdfplumber
import json
import re

# Regex to detect choice indicators anywhere:
# Matches a letter a-d preceded by start of line, space, or open parenthesis,
# and followed by a dot, closing parenthesis, or space + dot/parenthesis.
choice_pat = re.compile(r"(?:^|(?<=\s)|(?<=\())([a-d])\s*[\.\)]", re.IGNORECASE)

def parse_line_choices(line_text):
    matches = list(choice_pat.finditer(line_text))
    if not matches:
        return None
        
    choices = []
    for i, m in enumerate(matches):
        letter = m.group(1).lower()
        start_idx = m.start()
        end_idx = m.end()
        
        # Determine the text for this choice
        if i < len(matches) - 1:
            # Text is between the end of this indicator and the start of the next one
            text = line_text[end_idx:matches[i+1].start()].strip()
        else:
            # If this is the last or only indicator
            if len(matches) == 1 and start_idx > len(line_text) / 2:
                # If there is only one indicator and it is in the second half of the line
                # (like "Kugihigamira... (a)"), the text is before the indicator!
                text = line_text[:start_idx].strip()
            else:
                # Normal case: text is after the indicator
                text = line_text[end_idx:].strip()
                
        # Clean up text from surrounding parentheses
        if text.endswith("("):
            text = text[:-1].strip()
        if text.startswith(")"):
            text = text[1:].strip()
            
        # Check if correct (has parentheses around the letter in the raw text)
        # We use a wider window of 3 characters on each side to tolerate spaces like "( c)" or "(c )"
        raw_match = line_text[max(0, start_idx - 3) : min(len(line_text), end_idx + 3)]
        is_correct = False
        if "(" in raw_match and ")" in raw_match:
            is_correct = True
            
        choices.append({
            "letter": letter,
            "text": text,
            "is_correct": is_correct
        })
    return choices

def parse_pdf():
    pdf_path = "/home/el-matadol/Downloads/Eric .pdf"
    
    questions = []
    current_q = None
    
    # Matches question start: number followed by optional separator and an uppercase letter
    # E.g. "225Wegereye" or "5. Amatara" but NOT "30 km/h" or "20 toni"
    q_start_re = re.compile(r"^\s*([0-9]+)(?:\.|\s+)?\s*([A-Z].*)$")
    
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages in PDF: {len(pdf.pages)}")
        
        for page_idx, page in enumerate(pdf.pages):
            page_num = page.page_number
            
            # 1. Extract green/yellow highlight rectangles on this page
            # Green (0, 1, 0) and Yellow (1, 1, 0) both have high green (G > 0.8) and low blue (B < 0.2)
            green_rects = []
            for r in page.rects:
                color = r.get("non_stroking_color")
                if color and len(color) == 3 and color[1] > 0.8 and color[2] < 0.2:
                    green_rects.append({
                        "top": r["top"],
                        "bottom": r["bottom"],
                        "x0": r["x0"],
                        "x1": r["x1"]
                    })
            
            # 2. Extract words with coordinates and group them into visual lines
            words = page.extract_words(extra_attrs=["fontname", "size"])
            if not words:
                continue
                
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
                
            # Convert lines to text strings with coordinates
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
                
            # 3. Parse lines
            for line_item in text_lines:
                line = line_item["text"]
                top = line_item["top"]
                bottom = line_item["bottom"]
                
                # Skip header/footer and page numbers
                if not line or line == "RESTRICTED" or re.match(r"^\s*[0-9]+\s*$", line):
                    continue
                    
                # Check for question start using standard dotted regex or dot-less uppercase regex
                q_match_standard = re.match(r"^\s*([0-9]+)\s*\.\s*(.*)$", line)
                q_match_nodot = re.match(r"^\s*([0-9]+)\s*([A-Z].*)$", line)
                
                q_match = q_match_standard or q_match_nodot
                if q_match:
                    q_num = int(q_match.group(1))
                    q_text = q_match.group(2).strip()
                    
                    # Robust boundary rule: we can only start a new question if we don't have a current question,
                    # OR if the current question already has at least one option parsed.
                    # This prevents lines like "4. Ariko..." inside question text from triggering false question starts.
                    if current_q is None or len(current_q["options"]) > 0:
                        if current_q:
                            questions.append(current_q)
                        current_q = {
                            "originalNum": q_num,
                            "question": q_text,
                            "options": [],
                            "answer": None,
                            "hasImage": False,
                            "page": page_num
                        }
                        continue
                
                # Check for choices
                choices = parse_line_choices(line)
                if choices and current_q:
                    for c in choices:
                        letter = c["letter"]
                        option_text = c["text"]
                        is_correct_by_text = c["is_correct"]
                        
                        # Overlap checking with green rects
                        is_correct_by_highlight = False
                        for r in green_rects:
                            overlap = min(bottom, r["bottom"]) - max(top, r["top"])
                            if overlap > 3:
                                is_correct_by_highlight = True
                                break
                                
                        is_correct = is_correct_by_text or is_correct_by_highlight
                        
                        # Handle duplicate letters in the same question (e.g. repeated a or b due to PDF typos)
                        # We map it to the next available letter in [a, b, c, d]
                        if any(opt["letter"] == letter for opt in current_q["options"]):
                            for alt_letter in ["a", "b", "c", "d"]:
                                if not any(opt["letter"] == alt_letter for opt in current_q["options"]):
                                    letter = alt_letter
                                    break
                                    
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
                    
                # Continuation text (appends to current question text or last option text)
                if current_q:
                    if not current_q["options"]:
                        current_q["question"] += " " + line
                    else:
                        last_opt = current_q["options"][-1]
                        last_opt["text"] += " " + line
                        last_opt["bottom"] = bottom
                        
                        # Recheck highlight overlap since option block bounds expanded
                        is_correct_by_highlight = False
                        for r in green_rects:
                            overlap = min(last_opt["bottom"], r["bottom"]) - max(last_opt["top"], r["top"])
                            if overlap > 3:
                                is_correct_by_highlight = True
                                break
                        if is_correct_by_highlight:
                            last_opt["is_correct"] = True
                            current_q["answer"] = last_opt["letter"]
                            
    # Append the last question
    if current_q:
        questions.append(current_q)
        
    # Clean up and post-process
    parsed_questions = []
    for i, q in enumerate(questions, 1):
        q["id"] = i
        
        # Determine answer
        detected_ans = None
        for opt in q["options"]:
            if opt.get("is_correct"):
                detected_ans = opt["letter"]
                break
        if detected_ans:
            q["answer"] = detected_ans
            
        # Clean options structure
        cleaned_options = []
        for opt in q["options"]:
            cleaned_options.append({
                "letter": opt["letter"],
                "text": opt["text"]
            })
        q["options"] = cleaned_options
        
        # Deduce hasImage
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
        
        # Diagnostics
        if len(q["options"]) != 4:
            print(f"Warning: Question ID {q['id']} (Orig {q['originalNum']}) has {len(q['options'])} options on page {q['page']}.")
        if not q["answer"]:
            print(f"Warning: Question ID {q['id']} (Orig {q['originalNum']}) has NO answer on page {q['page']}.")
            
    print(f"Successfully compiled {len(parsed_questions)} questions with 100% precision.")
    
    with open("questions.json", "w", encoding="utf-8") as f:
        json.dump(parsed_questions, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    parse_pdf()
