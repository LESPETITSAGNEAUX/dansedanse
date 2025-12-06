# Electron Assets

This directory should contain the following icon files for the Windows build:

## Required Files

### icon.ico
- Windows application icon
- Size: 256x256 pixels (multi-resolution ICO recommended)
- Format: ICO (Windows Icon)
- Used for: Main application window, taskbar, installer

### tray-icon.png
- System tray icon
- Size: 16x16 or 32x32 pixels
- Format: PNG with transparency
- Used for: System tray when app is minimized

## Creating Icons

### From PNG source:
1. Create a 256x256 PNG image
2. Convert to ICO using online tools like:
   - https://icoconvert.com/
   - https://www.freeconvert.com/png-to-ico

### Using ImageMagick:
```bash
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

## Placeholder Generation

For testing, you can create simple placeholder icons:

```bash
# Using ImageMagick to create a simple placeholder
convert -size 256x256 xc:#1a1a2e -fill white -pointsize 72 -gravity center -annotate 0 "GTO" icon.png
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
convert -size 32x32 xc:#1a1a2e -fill white -pointsize 16 -gravity center -annotate 0 "G" tray-icon.png
```
