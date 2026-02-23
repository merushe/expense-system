// functions/api/test.js
export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // Hanya merespon untuk metode GET
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  console.log('🚀 Test Function Dimulai');
  console.log('Mengambil Environment Variables:');
  console.log('- Token Ada:', !!env.AIRTABLE_TOKEN);
  console.log('- Base ID Ada:', !!env.AIRTABLE_BASE_ID);
  console.log('- Base ID:', env.AIRTABLE_BASE_ID);

  // 1. Cek apakah environment variable ada
  if (!env.AIRTABLE_TOKEN || !env.AIRTABLE_BASE_ID) {
    const errorMsg = 'Environment variable AIRTABLE_TOKEN atau AIRTABLE_BASE_ID tidak ditemukan.';
    console.error('❌', errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), { status: 500, headers });
  }

  // 2. Coba dapatkan metadata base untuk memverifikasi akses (ini cara yang baik untuk test izin)
  try {
    const metaUrl = `https://api.airtable.com/v0/meta/bases/${env.AIRTABLE_BASE_ID}`;
    console.log('Mencoba mengakses metadata base:', metaUrl);

    const metaResponse = await fetch(metaUrl, {
      headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
    });

    console.log('Metadata Response Status:', metaResponse.status);

    if (!metaResponse.ok) {
      const errorText = await metaResponse.text();
      console.error('❌ Gagal mendapatkan metadata:', errorText);
      
      // Jika gagal, coba langkah 3 (test tabel) sebagai alternatif
      return await testTableAccess(env, headers);
    }

    const metaData = await metaResponse.json();
    console.log('✅ Berhasil mendapatkan metadata base:', metaData.name);

    // 3. Coba akses tabel "Expenses"
    return await testTableAccess(env, headers);

  } catch (error) {
    console.error('❌ Error saat tes metadata:', error);
    // Coba test tabel langsung sebagai fallback
    return await testTableAccess(env, headers);
  }
}

// Fungsi terpisah untuk menguji akses ke tabel spesifik
async function testTableAccess(env, headers) {
  console.log('Mencoba mengakses tabel "Expenses"...');
  const tableUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Expenses?maxRecords=1`;

  try {
    const tableResponse = await fetch(tableUrl, {
      headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
    });

    console.log('Tabel Response Status:', tableResponse.status);

    if (tableResponse.ok) {
      const data = await tableResponse.json();
      console.log('✅ Berhasil mengakses tabel. Jumlah record:', data.records?.length);
      return new Response(JSON.stringify({
        success: true,
        message: 'Koneksi ke Airtable berhasil!',
        recordsFound: data.records?.length || 0,
        tableAccess: 'OK'
      }), { status: 200, headers });
    } else {
      const errorText = await tableResponse.text();
      console.error('❌ Gagal mengakses tabel. Response:', errorText);
      return new Response(JSON.stringify({
        success: false,
        message: 'Gagal mengakses tabel Expenses',
        status: tableResponse.status,
        error: errorText,
        hint: 'Periksa kembali token dan pastikan token memiliki akses "Read" ke base ini.'
      }), { status: 200, headers }); // Kita tetap kirim 200 agar response bisa dibaca di browser
    }
  } catch (error) {
    console.error('❌ Error saat test tabel:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error saat test tabel',
      error: error.message
    }), { status: 200, headers });
  }
}
