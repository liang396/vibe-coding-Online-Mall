import Header from "./Header";

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Header />
      <main className="page-shell">{children}</main>
    </div>
  );
}
