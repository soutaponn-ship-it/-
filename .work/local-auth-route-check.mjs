const r=await fetch('http://127.0.0.1:3000/api/trpc/auth.localLogin',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({json:{email:'not-an-email',name:''}})});
console.log('status='+r.status);
console.log((await r.text()).slice(0,300));
