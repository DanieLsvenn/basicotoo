#!/usr/bin/env node

/**
 * Migration Script for API Centralization
 * 
 * This script helps migrate API calls to use the centralized API system.
 * Run with: node migrate-apis.js
 */

const fs = require('fs');
const path = require('path');

// URL patterns to replace
const URL_PATTERNS = [
  {
    pattern: /https:\/\/localhost:7218\/api\/Account\/profile/g,
    replacement: 'API_ENDPOINTS.ACCOUNT.PROFILE',
    import: 'API_ENDPOINTS'
  },
  {
    pattern: /https:\/\/localhost:7218\/api\/Account\/profile\/update/g,
    replacement: 'API_ENDPOINTS.ACCOUNT.PROFILE_UPDATE',
    import: 'API_ENDPOINTS'
  },
  {
    pattern: /https:\/\/localhost:7218\/api\/Account\/login/g,
    replacement: 'API_ENDPOINTS.ACCOUNT.LOGIN',
    import: 'API_ENDPOINTS'
  },
  {
    pattern: /https:\/\/localhost:7218\/api\/Account\/register/g,
    replacement: 'API_ENDPOINTS.ACCOUNT.REGISTER',
    import: 'API_ENDPOINTS'
  },
  {
    pattern: /https:\/\/localhost:7218\/api\/Service/g,
    replacement: 'API_ENDPOINTS.SERVICE.BASE',
    import: 'API_ENDPOINTS'
  },
  {
    pattern: /https:\/\/localhost:7218\/active-services/g,
    replacement: 'API_ENDPOINTS.SERVICE.ACTIVE',
    import: 'API_ENDPOINTS'
  },
  {
    pattern: /https:\/\/localhost:7286\/api\/Booking/g,
    replacement: 'API_ENDPOINTS.BOOKING.BASE',
    import: 'API_ENDPOINTS'
  },
  {
    pattern: /https:\/\/localhost:7103\/api\/Ticket/g,
    replacement: 'API_ENDPOINTS.TICKET.BASE',
    import: 'API_ENDPOINTS'
  },
  {
    pattern: /https:\/\/localhost:7024\/api\/order/g,
    replacement: 'API_ENDPOINTS.ORDER.BASE',
    import: 'API_ENDPOINTS'
  },
  {
    pattern: /https:\/\/localhost:7276\/api\/templates/g,
    replacement: 'API_ENDPOINTS.FORM.TEMPLATES',
    import: 'API_ENDPOINTS'
  },
];

// Fetch patterns to replace
const FETCH_PATTERNS = [
  {
    // Simple profile fetch
    pattern: /const response = await fetch\("https:\/\/localhost:7218\/api\/Account\/profile",\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`,?\s*\},?\s*\}\);/g,
    replacement: 'const response = await accountApi.getProfile();',
    import: 'accountApi'
  },
  {
    // Profile update
    pattern: /await fetch\("https:\/\/localhost:7218\/api\/Account\/profile\/update",\s*\{\s*method:\s*"PUT",\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(([^)]+)\)\s*\}\)/g,
    replacement: 'await accountApi.updateProfile($1)',
    import: 'accountApi'
  }
];

function scanDirectory(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath, callback);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  
  // Check for localhost URLs
  const localhostMatches = content.match(/https:\/\/localhost:\d+[^\s"'`]*/g);
  if (localhostMatches) {
    localhostMatches.forEach(url => {
      findings.push({
        type: 'URL',
        value: url,
        file: filePath
      });
    });
  }
  
  // Check for fetch calls
  const fetchMatches = content.match(/fetch\s*\(\s*["'`][^"'`]*localhost[^"'`]*["'`]/g);
  if (fetchMatches) {
    fetchMatches.forEach(fetchCall => {
      findings.push({
        type: 'FETCH',
        value: fetchCall,
        file: filePath
      });
    });
  }
  
  return findings;
}

function generateReport() {
  const srcDir = path.join(__dirname, 'src');
  const allFindings = [];
  
  console.log('🔍 Scanning for API URLs...\n');
  
  scanDirectory(srcDir, (filePath) => {
    const findings = analyzeFile(filePath);
    allFindings.push(...findings);
  });
  
  // Group by file
  const fileGroups = {};
  allFindings.forEach(finding => {
    const relativePath = path.relative(__dirname, finding.file);
    if (!fileGroups[relativePath]) {
      fileGroups[relativePath] = [];
    }
    fileGroups[relativePath].push(finding);
  });
  
  console.log('📊 API Migration Report');
  console.log('='.repeat(50));
  
  const totalFiles = Object.keys(fileGroups).length;
  const totalUrls = allFindings.length;
  
  console.log(`Files with API calls: ${totalFiles}`);
  console.log(`Total API references: ${totalUrls}\n`);
  
  Object.entries(fileGroups).forEach(([file, findings]) => {
    console.log(`📄 ${file}`);
    findings.forEach(finding => {
      console.log(`   ${finding.type}: ${finding.value}`);
    });
    console.log('');
  });
  
  // Generate migration suggestions
  console.log('💡 Migration Suggestions');
  console.log('='.repeat(50));
  
  const uniqueUrls = [...new Set(allFindings.map(f => f.value))];
  uniqueUrls.forEach(url => {
    const pattern = URL_PATTERNS.find(p => p.pattern.test(url));
    if (pattern) {
      console.log(`✅ ${url}`);
      console.log(`   → Use: ${pattern.replacement}`);
      console.log(`   → Import: ${pattern.import} from '@/lib/api-utils'`);
    } else {
      console.log(`⚠️  ${url}`);
      console.log(`   → Needs manual migration`);
    }
    console.log('');
  });
  
  return fileGroups;
}

// Main execution
if (require.main === module) {
  generateReport();
}

module.exports = { generateReport, scanDirectory, analyzeFile };
