const nodeVersion = process.versions.node;
const [major, minor] = nodeVersion.split('.').map(Number);

const REQUIRED_MAJOR = 20;
const REQUIRED_MINOR = 19;

if (major < REQUIRED_MAJOR || (major === REQUIRED_MAJOR && minor < REQUIRED_MINOR)) {
  console.error('\\n❌ ERROR: Node.js version is too old!\\n');
  console.error(`   Current version: ${nodeVersion}`);
  console.error(`   Required version: >=${REQUIRED_MAJOR}.${REQUIRED_MINOR}.0\\n`);
  console.error('📦 How to upgrade:\\n');
  console.error('   Option 1 - Using nvm (recommended):');
  console.error('     nvm install 20.19.0');
  console.error('     nvm use 20.19.0\\n');
  console.error('   Option 2 - Download directly:');
  console.error('     Visit: https://nodejs.org/\\n');
  console.error('   Option 3 - Using package manager:');
  console.error('     winget install OpenJS.NodeJS.LTS');
  console.error('     choco install nodejs-lts\\n');
  console.error('💡 After upgrading, run: npm install\\n');
  process.exit(1);
}

console.log(`✓ Node.js ${nodeVersion} is compatible`);
