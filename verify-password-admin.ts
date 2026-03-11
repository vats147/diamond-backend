import bcrypt from 'bcrypt';

async function main() {
  const password = 'Admin@1234';
  const hash = '$2b$12$LgBXrWzQw0lqcyUiiYxNg.8IBQ8tCzPbwtVy2En0pDTFTFj00kFHu';
  const valid = await bcrypt.compare(password, hash);
  console.log('Password matches demo hash with Admin@1234:', valid);
}

main().catch(console.error);
