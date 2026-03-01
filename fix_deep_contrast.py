import os
import re

directories = [
    r"C:\Users\julia\Downloads\stackblitz-starters-lvhktmos-main\app\config",
    r"C:\Users\julia\Downloads\stackblitz-starters-lvhktmos-main\app\qualidade",
    r"C:\Users\julia\Downloads\stackblitz-starters-lvhktmos-main\app\relatorios"
]

patterns_to_replace = [
    (re.compile(r"bgcolor:\s*['\"]#(?:fff|ffffff)['\"]"), "bgcolor: 'background.paper'"),
    (re.compile(r"bgcolor:\s*['\"]white['\"]"), "bgcolor: 'background.paper'"),
    (re.compile(r"backgroundColor:\s*['\"]white['\"]"), "backgroundColor: 'background.paper'"),
    (re.compile(r"bgcolor:\s*['\"]#fff7ed['\"]"), "bgcolor: 'warning.light'"),
    (re.compile(r"bgcolor:\s*['\"]#f5f5f5['\"]"), "bgcolor: 'action.hover'"),
    (re.compile(r"bgcolor:\s*['\"]#fafafa['\"]"), "bgcolor: 'action.hover'"),
    (re.compile(r"background:\s*['\"]white['\"](?!.*!important)"), "background: 'background.paper'"),
    # Keep print backgrounds white, handled below by skipping 'print-root' child logic if explicitly needed,
    # but the above regexes only target string exact matches usually.
]

print_safe_patterns = [
    (re.compile(r"bgcolor:\s*['\"]#525659['\"]"), "bgcolor: 'background.default'"),
]

for directory in directories:
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Careful replacements
                for pattern, replacement in patterns_to_replace:
                    # In reports, we want to KEEP the printed paper actually white, so we need to be careful.
                    # Usually print content in these scripts has "className='print-root'" or inline style "background: white;" 
                    # Let's use the generic regexes first, and we'll manually revert the print wrapper if it broke.
                    content = pattern.sub(replacement, content)
                
                for pattern, replacement in print_safe_patterns:
                    content = pattern.sub(replacement, content)
                
                # Specific fix for Cargos highlighting
                content = content.replace(
                    "role.is_system_role ? alpha(theme.palette.primary.main, 0.02) : 'white'",
                    "role.is_system_role ? alpha(theme.palette.primary.main, 0.02) : 'background.paper'"
                )
                
                # Specific fix for Desempenho Highlight
                content = content.replace(
                    "index === 0 ? 'rgba(255, 247, 237, 0.5)' : 'white'",
                    "index === 0 ? 'action.selected' : 'background.paper'"
                )
                
                if content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated: {filepath}")

print("Sweep complete.")
