const fs = require('fs');
const path = require('path');

const componentsDir = 'd:/GOMESZ SPEED PRINT/estampariapro/components';

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Replace radii
            content = content.replace(/rounded-\[2\.5rem_0\.75rem_2\.5rem_0\.75rem\]/g, 'rounded-xl');
            content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-2xl');
            content = content.replace(/rounded-\[2rem\]/g, 'rounded-2xl');

            // Remove blur
            content = content.replace(/\sbackdrop-blur-(?:sm|md|lg|xl|2xl)/g, '');
            content = content.replace(/\sbackdrop-blur/g, '');

            // Fix transparencies to solid colors
            content = content.replace(/bg-\[#0f172a\]\/(65|80|95|50)/g, 'bg-[#0f172a]');
            content = content.replace(/bg-\[#0b1221\]\/(20|30|50|65)/g, 'bg-[#0b1221]');
            
            // Fix border transparencies
            content = content.replace(/border-\[#1e293b\]\/(40|50|60|80)/g, 'border-[#1e293b]');

            // Fix white transparencies often used with blurry borders
            content = content.replace(/border-white\/5/g, 'border-[#1e293b]');
            content = content.replace(/border-white\/10/g, 'border-[#1e293b]');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDirectory(componentsDir);
console.log('Cleanup completed!');
