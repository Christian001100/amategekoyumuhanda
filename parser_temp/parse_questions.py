import re
import json

def parse_questions():
    with open("eric_text.txt", "r", encoding="utf-8") as f:
        text = f.read()

    lines = text.split("\n")
    
    questions = []
    current_q = None
    last_q_num = 0
    
    # Regex to detect question start: e.g. "237.iki cyapa gisobanura iki ?" or "5. Ibinyabiziga bikurikira..."
    q_start_re = re.compile(r"^\s*([0-9]+)\s*\.\s*(.*)$")
    
    # Regex to detect choices: e.g. "(a) Option", "a) Option", "a. Option", "( c) Option", "(c ) Option"
    # We match potential spaces around the letter inside optional parentheses
    choice_re = re.compile(r"^\s*\(?\s*([a-d])\s*\)?[\.\)\s]\s*(.*)$", re.IGNORECASE)
    
    idx = 0
    while idx < len(lines):
        line = lines[idx].strip()
        
        # Skip empty lines and page headers/footers
        if not line or line == "RESTRICTED" or re.match(r"^\s*?[0-9]+\s*$", line):
            idx += 1
            continue
            
        # Check if line is a question start
        q_match = q_start_re.match(line)
        if q_match:
            q_num = int(q_match.group(1))
            q_text = q_match.group(2).strip()
            
            # Enforce sequential logic: a question number shouldn't jump backward significantly
            # unless it is a known duplicate. For example, going from 24 to 4 is a false match.
            # We allow going back by up to 5 to handle duplicates (like 220 repeating).
            if current_q is None or q_num >= last_q_num - 5:
                if current_q:
                    questions.append(current_q)
                
                last_q_num = q_num
                current_q = {
                    "originalNum": q_num,
                    "question": q_text,
                    "options": [],
                    "answer": None,
                    "hasImage": False
                }
                idx += 1
                continue
            
        # Check if line is a choice
        choice_match = choice_re.match(line)
        if choice_match and current_q:
            raw_line = lines[idx]
            is_correct = False
            # Check for correct indicator: letter enclosed in parentheses with optional spaces
            if re.search(r"\(\s*[a-d]\s*\)", raw_line, re.IGNORECASE):
                is_correct = True
                
            letter = choice_match.group(1).lower()
            option_text = choice_match.group(2).strip()
            
            # Sometimes options span multiple lines! Let's collect them
            next_idx = idx + 1
            while next_idx < len(lines):
                next_line = lines[next_idx].strip()
                if not next_line:
                    next_idx += 1
                    continue
                if next_line == "RESTRICTED" or re.match(r"^\s*?[0-9]+\s*$", next_line):
                    next_idx += 1
                    continue
                
                # Check if next line is a new question or a choice
                next_q_match = q_start_re.match(next_line)
                is_next_q = False
                if next_q_match:
                    next_q_num = int(next_q_match.group(1))
                    if next_q_num >= last_q_num - 5:
                        is_next_q = True
                        
                if is_next_q or choice_re.match(next_line):
                    break
                
                option_text += " " + next_line
                next_idx += 1
            
            idx = next_idx
            
            # Check if this option letter already exists in current question
            # If it does, we avoid duplicates
            if not any(opt["letter"] == letter for opt in current_q["options"]):
                current_q["options"].append({
                    "letter": letter,
                    "text": option_text
                })
            
            if is_correct:
                current_q["answer"] = letter
                
            continue
            
        # If it is a continuation of the question text
        if current_q:
            if not current_q["options"]:
                current_q["question"] += " " + line
                
        idx += 1
        
    if current_q:
        questions.append(current_q)
        
    # Clean up and post-process
    for i, q in enumerate(questions, 1):
        q["id"] = i
        
        q_text_lower = q["question"].lower()
        has_img_word = any(w in q_text_lower for w in ["cyapa", "kimenyetso", "image", "shusho ya", "ishusho", "gihagaze nabi", "iri sangano", "[image"])
        
        q["hasImage"] = has_img_word
        if q["hasImage"]:
            q["imagePath"] = f"/assets/signs/q_{q['originalNum']}.png"
            
        if len(q["options"]) != 4:
            print(f"Warning: Question ID {q['id']} (Orig {q['originalNum']}) has {len(q['options'])} options.")
            
        if not q["answer"]:
            print(f"Warning: Question ID {q['id']} (Orig {q['originalNum']}) has NO answer.")
            
    print(f"Successfully parsed {len(questions)} questions.")
    
    with open("questions.json", "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    parse_questions()
