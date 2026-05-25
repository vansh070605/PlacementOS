import os
import shutil

BASE_DIR = r"e:\CODING\PlacementOS\src\components"

dirs = [
    "layout",
    "features/Dashboard",
    "features/JDAnalyzer",
    "features/CareerCompass",
    "features/SalaryIntelligence",
    "features/CoverLetterForge",
    "features/Trackers",
    "shared"
]

for d in dirs:
    os.makedirs(os.path.join(BASE_DIR, d), exist_ok=True)

moves = [
    ("Sidebar.jsx", "layout"),
    ("Sidebar.css", "layout"),
    ("DashboardLayout.jsx", "layout"),
    
    ("Dashboard.jsx", "features/Dashboard"),
    ("Dashboard.css", "features/Dashboard"),
    
    ("JDAnalyzer.jsx", "features/JDAnalyzer"),
    ("JDAnalyzer.css", "features/JDAnalyzer"),
    ("OutreachAgent.jsx", "features/JDAnalyzer"),
    ("OutreachAgent.css", "features/JDAnalyzer"),
    
    ("CareerCompass.jsx", "features/CareerCompass"),
    ("CareerCompass.css", "features/CareerCompass"),
    
    ("SalaryIntelligence.jsx", "features/SalaryIntelligence"),
    ("SalaryIntelligence.css", "features/SalaryIntelligence"),
    
    ("CoverLetterForge.jsx", "features/CoverLetterForge"),
    ("CoverLetterForge.css", "features/CoverLetterForge"),
    
    ("JobTracker.jsx", "features/Trackers"),
    ("JobTracker.css", "features/Trackers"),
    ("DSATracker.jsx", "features/Trackers"),
    ("DSATracker.css", "features/Trackers"),
    
    ("OnboardingModal.jsx", "shared"),
    ("OnboardingModal.css", "shared"),
]

for file, folder in moves:
    src_file = os.path.join(BASE_DIR, file)
    dst_folder = os.path.join(BASE_DIR, folder)
    if os.path.exists(src_file):
        shutil.move(src_file, dst_folder)
        print(f"Moved {file} to {folder}")
    else:
        print(f"Skipped {file} (not found)")
