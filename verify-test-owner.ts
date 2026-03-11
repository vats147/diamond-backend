import bcrypt from 'bcrypt';

async function main() {
  const password = 'Demo@123';
  const hash = '$2b$12$7EnOkmRg.l/2BNdaCneqpOB0ndCpqFIIhDYYTFyoEUJEwGXT/QsBS';
  const valid = await bcrypt.compare(password, hash);
  console.log('Password matches testowner hash:', valid);
}

main().catch(console.error);
