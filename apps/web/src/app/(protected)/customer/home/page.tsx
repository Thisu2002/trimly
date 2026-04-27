import { auth0 } from "@/lib/auth0";
import { getCurrentUser } from "@/app/api/getUser";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function HomePage() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login");

  const data = await getCurrentUser();
  if (data.role !== "customer") redirect("/admin/dashboard");

  const displayName = data.name?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-[#080e1a] text-white flex flex-col items-center justify-center px-6 overflow-hidden">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #ABD5FF; }
          50%       { opacity: 0.4; box-shadow: none; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
        .a1 { animation: fadeUp 0.6s ease both 0.05s; }
        .a2 { animation: fadeUp 0.6s ease both 0.15s; }
        .a3 { animation: fadeUp 0.6s ease both 0.28s; }
        .a4 { animation: fadeUp 0.6s ease both 0.4s; }
        .a5 { animation: fadeUp 0.6s ease both 0.52s; }
        .float { animation: floatY 5s ease-in-out infinite; }
        .pulse { animation: pulseDot 2s ease-in-out infinite; }
      `}</style>

      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[#1a3a6e]/30 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full bg-[#0d2a50]/40 blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(171,213,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(171,213,255,0.4) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      </div>

      {/* Logo */}
        <Image src="/trimly_logo.png"
                  alt="Trimly Logo"
                  width={200}
                  height={200}
                  className="opacity-90 mt-10 mb-10" />

      {/* Icon */}
      <div className="a2 relative mb-8 float">
          <svg className="w-20 h-20 text-[#ABD5FF]" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3" />
          </svg>
      </div>

      {/* Heading */}
      <div className="a3 relative text-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Hey {displayName}, you&apos;re in the wrong place!
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
          This portal is designed for salon owners and staff to manage their business.
          Your Trimly experience — booking, style try-ons, loyalty rewards — lives in the mobile app.
        </p>
      </div>

      {/* Features pills */}
      <div className="a4 relative flex flex-wrap justify-center gap-2 mb-10 max-w-md">
        {["Book appointments", "AI style try-on", "Loyalty rewards", "Payment history"].map((f) => (
          <span key={f} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-xs text-slate-400">
            <span className="w-1 h-1 rounded-full bg-[#ABD5FF]" />
            {f}
          </span>
        ))}
      </div>

      {/* QR + download */}
      <div className="a5 relative flex flex-col items-center gap-4">
        <div className="float p-4 rounded-2xl bg-white shadow-[0_0_50px_rgba(171,213,255,0.1)]">
          {/*
            Replace this SVG with <img src="/qr-app.png" width="128" height="128" />
            pointing to your real App Store / Play Store QR code.
          */}
          <svg viewBox="0 0 100 100" width="128" height="128" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="white"/>
            <rect x="5"  y="5"  width="28" height="28" rx="3" fill="#0b1220"/>
            <rect x="9"  y="9"  width="20" height="20" rx="2" fill="white"/>
            <rect x="13" y="13" width="12" height="12" rx="1" fill="#0b1220"/>
            <rect x="67" y="5"  width="28" height="28" rx="3" fill="#0b1220"/>
            <rect x="71" y="9"  width="20" height="20" rx="2" fill="white"/>
            <rect x="75" y="13" width="12" height="12" rx="1" fill="#0b1220"/>
            <rect x="5"  y="67" width="28" height="28" rx="3" fill="#0b1220"/>
            <rect x="9"  y="71" width="20" height="20" rx="2" fill="white"/>
            <rect x="13" y="75" width="12" height="12" rx="1" fill="#0b1220"/>
            {[38,42,46,50,54,58,62].map(x  => <rect key={"tx"+x}  x={x}  y="5"  width="3" height="3" fill="#0b1220"/>)}
            {[38,42,46,50,54,58,62].map(x  => <rect key={"bx"+x}  x={x}  y="92" width="3" height="3" fill="#0b1220"/>)}
            {[38,42,46,50,54,58,62].map(y  => <rect key={"ly"+y}  x="5"  y={y}  width="3" height="3" fill="#0b1220"/>)}
            {[38,42,46,50,54,58,62].map(y  => <rect key={"ry"+y}  x="92" y={y}  width="3" height="3" fill="#0b1220"/>)}
            {[[38,38],[42,42],[46,38],[50,46],[54,42],[58,38],[38,50],[46,50],[54,50],[38,58],[42,54],[50,58],[58,54],[42,46],[50,42],[58,46],[46,54],[62,42],[62,54]].map(([x,y]) => (
              <rect key={`d${x}${y}`} x={x} y={y} width="3" height="3" fill="#0b1220"/>
            ))}
          </svg>
        </div>

        <p className="text-xs text-slate-500 text-center">Scan to download the Trimly app</p>

        <div className="flex gap-3">
          <a
            href="#"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f1b33] border border-[#ABD5FF]/20 hover:border-[#ABD5FF]/40 transition-all group"
          >
            <svg className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div>
              <div className="text-[10px] text-slate-500 leading-none">Download on the</div>
              <div className="text-xs font-semibold text-slate-200">App Store</div>
            </div>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f1b33] border border-[#ABD5FF]/20 hover:border-[#ABD5FF]/40 transition-all group"
          >
            <svg className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.18 23.76c.3.17.64.24.99.19l13.12-7.57-2.83-2.83L3.18 23.76zM20.7 10.06L17.5 8.2 14.35 11l3.19 3.19 3.19-1.85c.91-.52.91-1.77-.03-2.28zM2.14.26C1.9.53 1.77.94 1.77 1.48v21.04c0 .54.14.95.38 1.21l.06.06 11.8-11.79v-.27L2.14.26zM14.35 13l-3-3 3-3 3.15 1.83v.34L14.35 13z"/>
            </svg>
            <div>
              <div className="text-[10px] text-slate-500 leading-none">Get it on</div>
              <div className="text-xs font-semibold text-slate-200">Google Play</div>
            </div>
          </a>
        </div>
      </div>

      {/* Logout */}
      <div className="relative mt-6 mb-6">
        <a
          href="/auth/logout"
          className="text-sm text-slate-400 hover:text-slate-300 transition-colors underline underline-offset-2"
        >
          Sign out
        </a>
      </div>
    </main>
  );
}