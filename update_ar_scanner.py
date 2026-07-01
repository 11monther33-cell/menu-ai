import re

with open('src/components/ARScanner.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix duplicate import
content = content.replace("import { ScanProgressHUD } from './ar/ScanProgressHUD';\nimport { ScanProgressHUD } from './ar/ScanProgressHUD';", "import { ScanProgressHUD } from './ar/ScanProgressHUD';")

# Ensure alpha is tracked in state so HUD can use it
content = content.replace("const [scanStage, setScanStage] = useState(0);", "const [scanStage, setScanStage] = useState(0);\n  const [currentAlpha, setCurrentAlpha] = useState(0);")

content = content.replace("processAngle(alpha);", "setCurrentAlpha(alpha);\n    processAngle(alpha);")
content = content.replace("processAngle(newAlpha);", "setCurrentAlpha(newAlpha);\n    processAngle(newAlpha);")

# Replace Circular Guide
old_circular_guide = re.search(r'\{\/\* Circular Guide - Original Design Restored \*\/\}.*?\{\/\* Real-time Instructions Panel \*\/\}', content, re.DOTALL)

if old_circular_guide:
    new_ui = '''{/* Circular Guide - New ScanProgressHUD */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <ScanProgressHUD 
                      progress={progress}
                      covered={Array.from({length: 72}).map((_, i) => scannedSectors.has(Math.floor(i/2)))}
                      currentAlpha={currentAlpha}
                      primaryColor="#C9A84C"
                      lang={isRtl ? 'ar' : 'en'}
                    />
                  </div>

                  {/* Real-time Instructions Panel */}'''
    content = content.replace(old_circular_guide.group(0), new_ui)

with open('src/components/ARScanner.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated ARScanner.tsx")
