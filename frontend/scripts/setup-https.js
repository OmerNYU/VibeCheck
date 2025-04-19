import mkcert from 'mkcert';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

async function setupHttps() {
  try {
    // Create .cert directory if it doesn't exist
    const certDir = join(rootDir, '.cert');
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir);
    }

    console.log('Setting up local Certificate Authority...');
    
    // Initialize mkcert
    const authority = await mkcert.createCA({
      organization: 'MoodMusic Development CA',
      countryCode: 'US',
      state: 'Development',
      locality: 'Localhost',
      validityDays: 365
    });

    // Save CA certificate and key
    const caKeyPath = join(certDir, 'rootCA-key.pem');
    const caCertPath = join(certDir, 'rootCA.cer');
    fs.writeFileSync(caKeyPath, authority.key);
    fs.writeFileSync(caCertPath, authority.cert);

    console.log('Creating domain certificates...');

    // Create domain certificate
    const cert = await mkcert.createCert({
      ca: { key: authority.key, cert: authority.cert },
      domains: ['localhost', '127.0.0.1'],
      validity: 365
    });

    // Save the certificates
    fs.writeFileSync(join(certDir, 'key.pem'), cert.key);
    fs.writeFileSync(join(certDir, 'cert.cer'), cert.cert);

    console.log('✅ HTTPS certificates generated successfully!');
    console.log('\nCertificate files created in .cert directory:');
    console.log('- .cert/key.pem       (Domain Private Key)');
    console.log('- .cert/cert.cer      (Domain Certificate)');
    console.log('- .cert/rootCA.cer    (CA Certificate)');
    console.log('- .cert/rootCA-key.pem (CA Private Key)');
    
    console.log('\n⚠️ Important: To trust these certificates in Windows:');
    console.log('1. Open the Windows Certificate Manager:');
    console.log('   - Press Win + R');
    console.log('   - Type "certmgr.msc" and press Enter');
    console.log('2. Right-click on "Trusted Root Certification Authorities" > "All Tasks" > "Import"');
    console.log('3. Browse to and select the rootCA.cer file in the .cert directory');
    console.log('4. Follow the wizard to complete the installation');
    console.log('5. Restart your browser');

  } catch (error) {
    console.error('❌ Error during certificate setup:', error);
    if (error.code === 'EACCES') {
      console.error('Permission denied. Try running with administrator privileges.');
    }
    process.exit(1);
  }
}

setupHttps(); 