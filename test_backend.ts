async function testBackend() {
  const formData = new FormData();
  formData.append('url', 'https://hungerpost.com/restaurants/oman/1909/irani-house-restaurant-oman/');

  const res = await fetch('https://visiono-ef1vz9xa6-11monther33-6074s-projects.vercel.app/api/index', {
    method: 'POST',
    body: formData
  });

  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("RESPONSE:", text.substring(0, 1000));
}

testBackend();
