
import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./supabase";
import Admin from "./Admin";

const money = (price) =>
  new Intl.NumberFormat("uz-UZ").format(price) + " so‘m";

function Catalog() {
  const [categories, setCategories] = useState(["Barchasi"]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Barchasi");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      setError("");

      const [categoryResult, productResult] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, sort_order")
          .order("sort_order"),

        supabase
          .from("products")
          .select("id, name, price, image_url, is_available, categories(name)")
          .eq("is_available", true)
          .order("created_at", { ascending: false }),
      ]);

      if (categoryResult.error || productResult.error) {
        setError(
          categoryResult.error?.message ||
          productResult.error?.message ||
          "Ma’lumotlarni yuklashda xatolik yuz berdi."
        );
        setLoading(false);
        return;
      }

      setCategories([
        "Barchasi",
        ...categoryResult.data.map((category) => category.name),
      ]);

      setProducts(
        productResult.data.map((product) => ({
          ...product,
          category: product.categories?.name || "Boshqa",
          image: product.image_url || "",
        }))
      );

      setLoading(false);
    }

    loadCatalog();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "Barchasi" ||
      product.category === activeCategory;

    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="site">

      <header className="header">
        <a className="logo" href="#">
          SANAN<span>.</span>
        </a>

        <nav className="header-actions">
          <a className="admin-link" href="/admin">
            Admin ↗
          </a>

          <a className="header-contact" href="#contact">
            Biz bilan bog‘lanish ↗
          </a>
        </nav>
      </header>


      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">
              YANGI MAVSUM · YANGI USLUB
            </span>

            <h1>
              Sizning uslubingiz.
              <br />
              Sizning tanlovingiz.
            </h1>

            <p>
              Har kuni uchun zamonaviy kiyimlar.
              O‘zingizga mos uslubni biz bilan toping.
            </p>

            <a className="hero-button" href="#catalog">
              Katalogni ko‘rish <span>↓</span>
            </a>
          </div>

          <div className="hero-decoration">
            <span>STYLE</span>
            <span>2026</span>
          </div>
        </section>

        <section className="catalog" id="catalog">
          <div className="section-heading">
            <div>
              <span className="eyebrow">BIZNING TANLOV</span>
              <h2>Katalog</h2>
            </div>

            <span className="product-count">
              {filteredProducts.length} ta mahsulot
            </span>
          </div>

          <div className="catalog-tools">
            <div className="categories">
              {categories.map((category) => (
                <button
                  key={category}
                  className={
                    activeCategory === category
                      ? "category active"
                      : "category"
                  }
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <input
              className="search"
              type="search"
              placeholder="Mahsulot qidirish..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {loading && (
            <p className="empty">Mahsulotlar yuklanmoqda...</p>
          )}

          {error && (
            <p className="empty">
              Ma’lumotlarni yuklashda xatolik: {error}
            </p>
          )}

          {!loading && !error && (
            <>
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <article className="product-card" key={product.id}>
                    <div className="product-image">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                        />
                      )}

                      <span className="product-tag">
                        {product.category}
                      </span>
                    </div>

                    <div className="product-info">
                      <h3>{product.name}</h3>

                      <div className="product-bottom">
                        <strong>{money(product.price)}</strong>

                        <a
                          className="product-link"
                          href="#contact"
                          aria-label={`${product.name} haqida so‘rash`}
                        >
                          ↗
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <p className="empty">Mahsulot topilmadi.</p>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="footer" id="contact">
        <div className="footer-main">
          <div>
            <a className="logo footer-logo" href="#">
              SANAN<span>.</span>
            </a>

            <p className="footer-description">
              Uslubingizni biz bilan kashf eting.
            </p>
          </div>

          <div className="footer-column">
            <h3>Aloqa</h3>
            <a href="tel:+998000000000">+998 93 436 75 73</a>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
            >
              Telegram ↗ t.me/sanan_bukhara
            </a>
            <a
              href="https://instagram.com/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram ↗ Sanan_
            </a>
            <a
              href="https://t.me/@nutfullayev_Amir"
              target="_blank"
              rel="noreferrer"
            >
              Telegram ↗ @nutfullayev_Amir
            </a>
          </div>

          <div className="footer-column">
            <h3>Manzilimiz</h3>
            <p>Buxoro shahar ,kalxoz bozor 67</p>
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noreferrer"
            >
              Xaritada ko‘rish ↗
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 MODA. Barcha huquqlar himoyalangan.</span>
          <span>Oddiylik — bu uslub.</span>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const isAdminPage = window.location.pathname === "/admin";

  if (isAdminPage) {
    return <Admin />;
  }

  return <Catalog />;
}

export default App;
