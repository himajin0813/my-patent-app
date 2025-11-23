import { useState } from "react";

export default function Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/generate-wordcloud", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setImageSrc(data.image);
      } else {
        alert("エラー: " + data.error);
      }
    } catch (err) {
      alert("通信エラー: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "20px" }}>
      <h1>ワードクラウド生成アプリ</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} />

      {loading && <p>生成中です...</p>}

      {imageSrc && (
        <div style={{ marginTop: "20px" }}>
          <h2>生成されたワードクラウド:</h2>
          <img src={imageSrc} alt="WordCloud" style={{ maxWidth: "100%" }} />
        </div>
      )}
    </main>
  );
}
