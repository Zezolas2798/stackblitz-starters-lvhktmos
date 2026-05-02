import zipfile
import re
with zipfile.ZipFile(r'C:\Users\julia\Downloads\stackblitz-starters-lvhktmos-main\_knowledge\UAN\UAN-20260418T152749Z-3-001\UAN\Engenharia de Processos em UAN.docx', 'r') as z:
    xml = z.read('word/document.xml').decode('utf-8')
    rels = z.read('word/_rels/document.xml.rels').decode('utf-8')
    rel_map = {}
    for match in re.findall(r'<Relationship Id="(.*?)" .*? Target="(.*?)"', rels):
        rel_map[match[0]] = match[1]
    
    for blished in re.findall(r'<a:blip r:embed="(.*?)"', xml):
        print(rel_map.get(blished))
