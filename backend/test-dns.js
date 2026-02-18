const dns = require('dns');

console.log('Testing DNS resolution in Node.js...\n');

dns.lookup('db.bgetctcanncenczqebrt.supabase.co', (err, address, family) => {
  if (err) {
    console.log('❌ DNS Lookup Failed:', err.message);
    console.log('\nTrying with dns.resolve4...\n');
    
    dns.resolve4('db.bgetctcanncenczqebrt.supabase.co', (err2, addresses) => {
      if (err2) {
        console.log('❌ DNS Resolve4 Failed:', err2.message);
        console.log('\nYour Node.js cannot resolve DNS. This might be a network/firewall issue.');
      } else {
        console.log('✅ DNS Resolve4 Success!');
        console.log('IP Addresses:', addresses);
      }
      process.exit();
    });
  } else {
    console.log('✅ DNS Lookup Success!');
    console.log('Address:', address);
    console.log('Family:', family === 4 ? 'IPv4' : 'IPv6');
    process.exit();
  }
});
