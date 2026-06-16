// Static privacy/security notice (server-safe).
export function PrivacyNotice() {
  const items = [
    { icon: "🔒", label: "Private Life OS" },
    { icon: "🔑", label: "Password protected" },
    { icon: "🙈", label: "noindex / nofollow" },
    { icon: "🚫", label: "Not public" },
    { icon: "🗄️", label: "Data in your private Neon DB" },
  ];
  return (
    <div className="card-tight">
      <p className="label">Private &amp; secure</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((i) => (
          <span key={i.label} className="chip text-slate-300">{i.icon} {i.label}</span>
        ))}
      </div>
    </div>
  );
}
