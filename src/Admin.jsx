
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./Admin.css";

export default function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Kirish amalga oshmadi: " + error.message);
      return;
    }

    if (data.user?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setError("Sizda admin huquqi mavjud emas.");
      return;
    }

    setUser(data.user);
  }

  async function loadData() {
    setError("");

    const [categoryResult, productResult] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name")
        .order("sort_order"),

      supabase
        .from("products")
        .select("id, name, price, image_url, categories(name)")
        .order("created_at", { ascending: false }),
    ]);

    if (categoryResult.error || productResult.error) {
      setError(
        categoryResult.error?.message ||
          productResult.error?.message ||
          "Ma’lumotlarni yuklashda xatolik."
      );
      return;
    }

    setCategories(categoryResult.data || []);
    setProducts(productResult.data || []);

    if (categoryResult.data?.length && !categoryId) {
      setCategoryId(String(categoryResult.data[0].id));
    }
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim() || !price || !categoryId || !image) {
      setError("Barcha maydonlarni to‘ldiring va rasm tanlang.");
      return;
    }

    if (Number(price) <= 0 || !Number.isFinite(Number(price))) {
      setError("Narxni to‘g‘ri kiriting.");
      return;
    }

    setLoading(true);

    try {
      const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `products/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, image);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          price: Number(price),
          category_id: categoryId,
          image_url: urlData.publicUrl,
          is_available: true,
        });

      if (insertError) {
        throw insertError;
      }

      setName("");
      setPrice("");
      setImage(null);

      const fileInput = document.getElementById("product-image");
      if (fileInput) fileInput.value = "";

      setMessage("Mahsulot muvaffaqiyatli qo‘shildi!");
      await loadData();
    } catch (err) {
      setError("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `"${product.name}" mahsulotini o‘chirmoqchimisiz?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      setError("O‘chirib bo‘lmadi: " + error.message);
      return;
    }

    setMessage("Mahsulot o‘chirildi.");
    await loadData();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setPassword("");
  }

  if (!user) {
    return (
      <main className="admin-page">
        <form className="admin-card" onSubmit={handleLogin}>
          <a className="admin-logo" href="/">
            MODA<span>.</span>
          </a>

          <h1>Admin panel</h1>
          <p>Davom etish uchun hisobingizga kiring.</p>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin emailingiz"
            autoComplete="username"
            required
          />

          <label htmlFor="password">Parol</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parolingiz"
            autoComplete="current-password"
            required
          />

          {error && <p className="admin-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Tekshirilmoqda..." : "Kirish"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-page admin-dashboard">
      <section className="admin-card admin-wide">
        <div className="admin-top">
          <div>
            <a className="admin-logo" href="/">
              MODA<span>.</span>
            </a>
            <h1>Mahsulotlarni boshqarish</h1>
            <p>Yangi mahsulot qo‘shing yoki mavjudini o‘chiring.</p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={handleLogout}
          >
            Chiqish
          </button>
        </div>

        <form className="product-form" onSubmit={handleAddProduct}>
          <h2>Yangi mahsulot</h2>

          <label htmlFor="product-name">Mahsulot nomi</label>
          <input
            id="product-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: Qora klassik kostyum"
            required
          />

          <label htmlFor="product-price">Narxi (so‘m)</label>
          <input
            id="product-price"
            type="number"
            min="1"
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="850000"
            required
          />

          <label htmlFor="product-category">Kategoriya</label>
          <select
            id="product-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Kategoriyani tanlang</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <label htmlFor="product-image">Mahsulot rasmi</label>
          <input
            id="product-image"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            required
          />

          {image && (
            <p className="file-name">Tanlangan rasm: {image.name}</p>
          )}

          {error && <p className="admin-error">{error}</p>}
          {message && <p className="admin-success">{message}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Saqlanmoqda..." : "Mahsulotni qo‘shish"}
          </button>
        </form>

        <div className="admin-products">
          <h2>Mavjud mahsulotlar ({products.length})</h2>

          {products.map((product) => (
            <article className="admin-product" key={product.id}>
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} />
              ) : (
                <div className="admin-no-image">Rasm yo‘q</div>
              )}

              <div className="admin-product-info">
                <strong>{product.name}</strong>
                <span>{product.categories?.name || "Boshqa"}</span>
                <span>
                  {new Intl.NumberFormat("uz-UZ").format(product.price)} so‘m
                </span>
              </div>

              <button
                type="button"
                className="delete-button"
                onClick={() => handleDelete(product)}
              >
                O‘chirish
              </button>
            </article>
          ))}

          {products.length === 0 && (
            <p>Hozircha mahsulotlar yo‘q.</p>
          )}
        </div>

        <a className="back-to-store" href="/">
          ← Katalog sahifasiga qaytish
        </a>
      </section>
    </main>
  );
}
