import bs4
import glob
import re
import os

def html_to_jsx(html_str):
    # Basic class to className
    jsx = html_str.replace('class=', 'className=')
    
    # Self close inputs, imgs, hrs, brs
    jsx = re.sub(r'<input([^>]*)(?<!/)>', r'<input\1 />', jsx)
    jsx = re.sub(r'<img([^>]*)(?<!/)>', r'<img\1 />', jsx)
    jsx = re.sub(r'<hr([^>]*)(?<!/)>', r'<hr\1 />', jsx)
    jsx = re.sub(r'<br([^>]*)(?<!/)>', r'<br\1 />', jsx)
    
    # Replace HTML comments
    jsx = re.sub(r'<!--(.*?)-->', r'{/* \1 */}', jsx)
    
    # Fix style strings
    def style_repl(match):
        style_str = match.group(1)
        if 'font-variation-settings' in style_str:
            return 'style={{ fontVariationSettings: "\'FILL\' 1" }}'
        elif 'width' in style_str:
            w = style_str.split(":")[1].strip().replace(";", "")
            return f'style={{{{ width: "{w}" }}}}'
        return 'style={{}}'
    
    jsx = re.sub(r'style="([^"]*)"', style_repl, jsx)
    
    # Replace glass recipe
    glass_recipe = 'bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]'
    jsx = jsx.replace('bg-white/10 border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]', glass_recipe)
    jsx = jsx.replace('bg-white/10 border-b border-white/10', f'{glass_recipe} border-b-0')
    jsx = jsx.replace('bg-white/10', glass_recipe)
    
    # Replace light theme colors with generic tailwind dark theme
    jsx = jsx.replace('text-on-surface-variant', 'text-slate-400')
    jsx = jsx.replace('text-on-surface', 'text-white')
    jsx = jsx.replace('text-on-background', 'text-white')
    jsx = jsx.replace('text-primary-container', 'text-indigo-400')
    jsx = jsx.replace('text-primary', 'text-indigo-300')
    jsx = jsx.replace('bg-background', 'bg-transparent')
    jsx = jsx.replace('bg-surface', 'bg-transparent')
    jsx = jsx.replace('bg-primary-container/20 border-l-4 border-primary-container', 'bg-indigo-500/20 border-l-4 border-indigo-400')
    
    # Misc text replacements
    jsx = jsx.replace('font-headline-md', 'font-sora')
    jsx = jsx.replace('font-body-md', 'font-inter')
    jsx = jsx.replace('font-title-md', 'font-sora font-semibold')
    
    return jsx

files = glob.glob('stitch_*.html')
out_dir = r'C:/Users/Vansh Agrawal/.gemini/antigravity-ide/brain/14019283-468a-40f3-bf5b-446656c7a96e/scratch'
os.makedirs(out_dir, exist_ok=True)

for f in files:
    try:
        with open(f, 'rb') as file:
            soup = bs4.BeautifulSoup(file.read(), 'html.parser')
        
        aside = soup.find('aside')
        main = soup.find('main')
        
        if aside:
            out_name = os.path.join(out_dir, f.replace('.html', '_sidebar_raw.jsx'))
            with open(out_name, 'w', encoding='utf-8') as out:
                out.write(html_to_jsx(str(aside)))
                
        if main:
            out_name = os.path.join(out_dir, f.replace('.html', '_main_raw.jsx'))
            with open(out_name, 'w', encoding='utf-8') as out:
                out.write(html_to_jsx(str(main)))
        print(f"Converted {f}")
    except Exception as e:
        print(f"Failed {f}: {e}")
