const r=await fetch('http://127.0.0.1:3000/api/trpc/parent.sharedStudy');
console.log('status='+r.status);
console.log((await r.text()).slice(0,300));
