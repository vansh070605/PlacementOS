import os

files = [
    'frontend/components/features/ATSScorer/ATSScorer.jsx',
    'frontend/components/features/SalaryIntelligence/SalaryIntelligence.jsx',
    'frontend/components/features/JDAnalyzer/JDAnalyzer.jsx',
    'frontend/components/features/JDAnalyzer/OutreachAgent.jsx',
    'frontend/components/features/Trackers/DSATracker.jsx',
    'frontend/components/features/Trackers/JobTracker.jsx',
    'frontend/components/features/Settings/Settings.jsx'
]

for fpath in files:
    if not os.path.exists(fpath): continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add animate-fade-in to the main wrapper if it exists and doesn't have it
    wrapper_classes = ['ats-scorer-container', 'si-wrapper', 'jda-wrapper', 'oa-wrapper', 'tracker-wrapper', 'settings-wrapper']
    for wc in wrapper_classes:
        if wc in content and 'animate-fade-in' not in content:
            content = content.replace(f'className="{wc}"', f'className="{wc} animate-fade-in"')
    
    # 2. Add animate-slide-up and stagger delays to cards
    parts = content.split('bento-card span-')
    if len(parts) > 1:
        new_content = parts[0]
        delay = 100
        for i in range(1, len(parts)):
            idx = 0
            while idx < len(parts[i]) and parts[i][idx] not in ['"', "'", ' ']:
                idx += 1
            if 'animate-slide-up' not in parts[i]:
                parts[i] = parts[i][:idx] + f' animate-slide-up delay-{delay}' + parts[i][idx:]
                delay += 100
                if delay > 500: delay = 100
            new_content += 'bento-card span-' + parts[i]
        content = new_content
        
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Animation classes injected!")
