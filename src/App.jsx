import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

function App() {
  const [dataList, setDataList] = useState([]);
  const [inputVal, setInputVal] = useState('');

  const dataRef = collection(db, "koleksi_data");

  // Mengambil data secara realtime dari Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(dataRef, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setDataList(items);
    });

    return () => unsubscribe();
  }, []);

  // Fungsi Tambah Data
  const tambahData = async () => {
    if (!inputVal.trim()) return alert("Data tidak boleh kosong!");
    try {
      await addDoc(dataRef, { nama: inputVal, created: new Date() });
      setInputVal('');
    } catch (e) {
      console.error("Gagal menambah data:", e);
    }
  };

  // Fungsi Hapus Data
  const hapusData = async (id) => {
    try {
      await deleteDoc(doc(db, "koleksi_data", id));
    } catch (e) {
      console.error("Gagal menghapus data:", e);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', fontFamily: 'sans-serif' }}>
      <h2>Daftar Data Global</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input 
          type="text" 
          value={inputVal} 
          onChange={(e) => setInputVal(e.target.value)} 
          placeholder="Masukkan data baru..."
          style={{ padding: '8px', flex: 1 }}
        />
        <button onClick={tambahData} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Tambah Data
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {dataList.map((item) => (
          <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f4f4f4', marginBottom: '8px', borderRadius: '4px' }}>
            <span>{item.nama}</span>
            <button onClick={() => hapusData(item.id)} style={{ color: 'white', background: 'red', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
              Hapus
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
