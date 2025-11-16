// Script to generate a bcrypt password hash
// Usage: node generate-password-hash.js <password>

const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node generate-password-hash.js <password>');
  process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  
  console.log('\nPassword hash generated:');
  console.log(hash);
  console.log('\nSQL to update admin password:');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`);
  console.log('\n');
});

