import os
import re

def fix(path):
    for root, dirs, files in os.walk(path):
        for f in files:
            if f.endswith('.jsx'):
                p = os.path.join(root, f)
                with open(p, 'r', encoding='utf-8') as file:
                    c = file.read()
                
                c = re.sub(r'\\http://\\\$\{window\.location\.hostname\}:8000([^\']*)\'', r'`http://${window.location.hostname}:8000\1`', c)
                
                with open(p, 'w', encoding='utf-8') as file:
                    file.write(c)

fix('frontend')
