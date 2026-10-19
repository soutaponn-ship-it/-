const r=await fetch('http://192.168.68.59:3000/api/auth/google');
console.log('status='+r.status);
console.log(await r.text());
