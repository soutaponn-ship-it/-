const r=await fetch('http://127.0.0.1:3000/api/auth/google',{redirect:'manual'});
console.log('status='+r.status);
const location=r.headers.get('location')||'';
const u=new URL(location);
console.log('redirect_uri='+u.searchParams.get('redirect_uri'));
console.log('has_client_id='+Boolean(u.searchParams.get('client_id')));
