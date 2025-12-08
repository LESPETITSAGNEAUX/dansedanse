const path = require('path');
const fs = require('fs');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    return false;
  }
  
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  
  return true;
}

exports.default = async function(context) {
  console.log('After pack hook running...');
  
  const { appOutDir, packager } = context;
  const platform = packager.platform.name;
  
  if (platform === 'windows') {
    console.log('Windows build detected, copying native modules...');
    
    const unpackedNodeModules = path.join(appOutDir, 'resources', 'app.asar.unpacked', 'node_modules');
    
    const nativeModules = [
      'robotjs',
      'node-window-manager',
      'screenshot-desktop',
      'extract-file-icon',
      'ref-napi',
      'ffi-napi'
    ];
    
    for (const moduleName of nativeModules) {
      const srcModulePath = path.join(process.cwd(), 'node_modules', moduleName);
      const destModulePath = path.join(unpackedNodeModules, moduleName);
      
      if (fs.existsSync(srcModulePath)) {
        console.log(`Copying ${moduleName}...`);
        const success = copyDirRecursive(srcModulePath, destModulePath);
        if (success) {
          console.log(`✓ ${moduleName} copied successfully`);
          
          const buildRelease = path.join(destModulePath, 'build', 'Release');
          if (fs.existsSync(buildRelease)) {
            const nodeFiles = fs.readdirSync(buildRelease).filter(f => f.endsWith('.node'));
            console.log(`  Native binaries: ${nodeFiles.join(', ') || 'none'}`);
          }
        }
      } else {
        console.log(`⚠ ${moduleName} not found in node_modules (optional)`);
      }
    }
    
    const nativePath = path.join(appOutDir, 'resources', 'native');
    fs.mkdirSync(nativePath, { recursive: true });
    
    const sourceDxgi = path.join(process.cwd(), 'native', 'build', 'Release', 'dxgi-capture.node');
    const destDxgi = path.join(nativePath, 'dxgi-capture.node');
    
    if (fs.existsSync(sourceDxgi)) {
      fs.copyFileSync(sourceDxgi, destDxgi);
      console.log('✓ DXGI module copied successfully');
    } else {
      console.log('⚠ DXGI module not found (optional)');
    }
  }
  
  console.log('After pack hook completed');
};
