import { Sparkles } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { getCurrentUser } from "@/app/api/getUser";

export default async function Page() {
  const session = await auth0.getSession();

  if (session) {
    const user = await getCurrentUser();
    if (!user) redirect("/auth/login");
    if (user.role === "customer") {
      redirect("/customer/home");
    } else {
      redirect("/admin/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-[#080e1a] text-white overflow-x-hidden">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
        .a1 { animation: fadeUp 0.7s ease both 0.1s; }
        .a2 { animation: fadeUp 0.7s ease both 0.25s; }
        .a3 { animation: fadeUp 0.7s ease both 0.4s; }
        .a4 { animation: fadeUp 0.7s ease both 0.55s; }
        .a5 { animation: fadeUp 0.7s ease both 0.7s; }
        .pulse-dot { animation: pulseDot 2s ease-in-out infinite; }
        .float { animation: floatY 6s ease-in-out infinite; }
        .fcard:hover .ficon { transform: scale(1.1); }
        .ficon { transition: transform 0.25s ease; }
        .uline { position: relative; }
        .uline::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: #ABD5FF; transition: width 0.2s ease; }
        .uline:hover::after { width: 100%; }
        @keyframes glisten {
          0% {transform: translateX(-100%); opacity: 0;}
          10% {opacity: 1;}
          90% {opacity: 1;}
          100% {transform: translateX(400%); opacity: 0;}
        }
        .nav-glisten{
          position: relative;
          overflow: hidden;
        }
        .nav-glisten::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 25%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent 0%, #ABD5FF 50%, #ffffffaa 60%, #ABD5FF 80%, transparent 100%);
          animation: glisten 1.2s ease-in-out 0.2s 1 both;
          pointer-events: none;
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav className="nav-glisten fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 h-16 bg-[#080e1a]/80 backdrop-blur-md border-b border-white/5">
        <Image
          src="/logo_cropped.png"
          alt="Trimly Logo"
          width={70}
          height={80}
        />
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a
            href="#features"
            className="uline hover:text-white transition-colors"
          >
            Features
          </a>
          <a href="#how" className="uline hover:text-white transition-colors">
            How It Works
          </a>
          <div className="uline hover:text-white transition-colors flex items-center gap-2">
            <a href="#consumer">For Consumers</a>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/auth/login"
            className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-1.5"
          >
            Sign in
          </a>
          <a
            href="/auth/login?screen_hint=signup&role=admin"
            className="text-sm font-medium px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#273d5e] to-[#1a2d48] border border-[#ABD5FF]/30 text-[#ABD5FF] hover:border-[#ABD5FF]/60 hover:shadow-[0_0_20px_rgba(171,213,255,0.15)] transition-all duration-200"
          >
            Get started free
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-screen px-6 pt-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[#1a3a6e]/35 blur-[130px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-[#0d2a50]/50 blur-[80px]" />
          <div className="absolute bottom-10 right-1/4 w-[250px] h-[250px] rounded-full bg-[#0d2a50]/40 blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(171,213,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(171,213,255,0.4) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="a1 relative mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ABD5FF]/8 border border-[#ABD5FF]/20 text-xs text-[#ABD5FF] tracking-wide uppercase">
          <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-[#ABD5FF] shadow-[0_0_6px_#ABD5FF]" />
          AI-Powered Salon Management
        </div>

        <h1 className="a2 relative max-w-4xl text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
          <span className="text-white">Run your salon</span>
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #ABD5FF 0%, #6ea8dc 60%, #4a8bc4 100%)",
            }}
          >
            like a pro
          </span>
        </h1>

        <p className="a3 relative max-w-2xl text-lg text-slate-400 mb-10 leading-relaxed">
          Trimly brings bookings, staff, inventory, and analytics together in
          one elegant dashboard — so you can focus on what you do best.
        </p>

        <div className="a4 relative flex flex-col sm:flex-row gap-3 items-center mb-16">
          <a
            href="/auth/login?screen_hint=signup&role=admin"
            className="group inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#274b72] to-[#1a3558] border border-[#ABD5FF]/30 text-[#ABD5FF] hover:border-[#ABD5FF]/60 hover:shadow-[0_0_30px_rgba(171,213,255,0.2)] transition-all duration-300"
          >
            Start free trial
            <svg
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </a>
          <a
            href="/auth/login"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-medium text-sm border border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20 transition-all duration-200"
          >
            Sign in to dashboard
          </a>
        </div>

        <div className="a5 relative flex flex-wrap justify-center gap-20 text-center border-t border-white/5 pt-10 w-full max-w-2xl">
          {[
            { value: "10K+", label: "Active salons" },
            { value: "1M+", label: "Bookings made" },
            { value: "99.9%", label: "Uptime" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl text-white mb-2">
                {s.value}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Business-only callout banner ── */}
      <section className="px-6 py-4 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-[#ABD5FF]/15 bg-[#0f1b33]/60 px-8 py-5 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#ABD5FF]/10 border border-[#ABD5FF]/20 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-[#ABD5FF]"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-slate-300">
              <span className="text-white font-medium">
                This portal is for salon businesses only.
              </span>{" "}
              Trimly clients book appointments and manage their beauty journey
              through the dedicated consumer app.
            </p>
          </div>
          <a
            href="#consumer"
            className="flex-shrink-0 text-xs text-[#ABD5FF] border border-[#ABD5FF]/25 px-4 py-2 rounded-lg hover:bg-[#ABD5FF]/8 transition-all whitespace-nowrap"
          >
            See the app ↓
          </a>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative px-6 py-28 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs text-[#ABD5FF] uppercase tracking-widest mb-3">
            Everything you need
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Your command center
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
              title: "Command Center",
              desc: "Live view of floor activity, daily revenue, and upcoming tasks — all in one place.",
            },
            {
              icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
              title: "Smart Scheduling",
              desc: "AI-optimized calendar that reduces gaps and maximises daily revenue.",
            },
            {
              icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
              title: "Inventory Genius",
              desc: "Automated stock tracking with intelligent re-ordering based on usage patterns.",
            },
            {
              icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
              title: "Staff Management",
              desc: "Track performance, calculate commissions automatically, manage shifts effortlessly.",
            },
            {
              icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
              title: "Analytics & Reports",
              desc: "Deep insights into revenue trends, customer behaviour, and performance metrics.",
            },
            {
              icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
              title: "AI-Powered CRM",
              desc: "Client profiles with service history, preferences, and AI-driven retention insights.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="fcard group p-6 rounded-2xl bg-gradient-to-b from-[#0f1b33]/80 to-[#0b1220]/80 border border-white/5 hover:border-[#ABD5FF]/20 transition-all duration-300 hover:shadow-[0_0_40px_rgba(171,213,255,0.06)]"
            >
              <div
                className="ficon w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: "#ABD5FF18",
                  boxShadow: "0 0 0 1px #ABD5FF22",
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="#ABD5FF"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={f.icon}
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-1.5 text-sm">
                {f.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how"
        className="relative px-6 py-20 bg-gradient-to-b from-[#080e1a] via-[#0b1522] to-[#080e1a]"
      >
        <div className="max-w-4xl mx-auto text-center mb-14">
          <p className="text-xs text-[#ABD5FF] uppercase tracking-widest mb-3">
            Simple setup
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Up and running in minutes
          </h2>
        </div>
        <div className="max-w-2xl mx-auto flex flex-col">
          {[
            {
              step: "01",
              title: "Create your salon profile",
              desc: "Add your services, team, and business hours. Takes less than 5 minutes.",
            },
            {
              step: "02",
              title: "Invite your staff",
              desc: "Each stylist gets their own login with role-based permissions and a personal schedule view.",
            },
            {
              step: "03",
              title: "Go live",
              desc: "Share your booking link and start accepting appointments. Payments, reminders, and analytics work from day one.",
            },
          ].map((item, i) => (
            <div key={item.step} className="flex gap-6 items-start relative">
              {i < 2 && (
                <div className="absolute left-[19px] top-10 w-px h-full bg-gradient-to-b from-[#ABD5FF]/20 to-transparent" />
              )}
              <div className="flex-shrink-0 w-10 h-10 rounded-full border border-[#ABD5FF]/30 bg-[#ABD5FF]/8 flex items-center justify-center">
                <span className="text-xs font-bold text-[#ABD5FF]">
                  {item.step}
                </span>
              </div>
              <div className="pb-10">
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── For Consumers ── */}
      <section id="consumer" className="relative px-6 py-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-[#1a3a6e]/25 blur-[100px]" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-[#0f1b33]/70 to-[#080e1a]/90 p-10 md:p-14 flex flex-col md:flex-row items-center gap-12">
            {/* Text */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300">For Consumers</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-snug">
                Looking to book your
                <br />
                next appointment?
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6 text-sm">
                This web portal is built exclusively for salon owners and
                stylists. As a client, you get a far richer experience through
                the{" "}
                <span className="text-white font-medium">
                  Trimly mobile app
                </span>{" "}
                — book appointments, try styles with AI, track loyalty rewards,
                and pay seamlessly.
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                {[
                  "Smart booking",
                  "AI style try-on",
                  "Loyalty rewards",
                  "Seamless payments",
                ].map((feat) => (
                  <span
                    key={feat}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#ABD5FF]" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* QR card */}
            <div className="flex flex-col items-center gap-4 flex-shrink-0">
              <div className="float p-5 rounded-2xl bg-white shadow-[0_0_60px_rgba(171,213,255,0.12)]">
                {/*
                  Replace this SVG with an <img src="/qr-app.png" /> pointing to your real QR code.
                  The placeholder below is a decorative QR pattern only.
                */}
                <svg
                  viewBox="0 0 100 100"
                  width="148"
                  height="148"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="100" height="100" fill="white" />
                  {/* Finder top-left */}
                  <rect
                    x="5"
                    y="5"
                    width="28"
                    height="28"
                    rx="3"
                    fill="#0b1220"
                  />
                  <rect
                    x="9"
                    y="9"
                    width="20"
                    height="20"
                    rx="2"
                    fill="white"
                  />
                  <rect
                    x="13"
                    y="13"
                    width="12"
                    height="12"
                    rx="1"
                    fill="#0b1220"
                  />
                  {/* Finder top-right */}
                  <rect
                    x="67"
                    y="5"
                    width="28"
                    height="28"
                    rx="3"
                    fill="#0b1220"
                  />
                  <rect
                    x="71"
                    y="9"
                    width="20"
                    height="20"
                    rx="2"
                    fill="white"
                  />
                  <rect
                    x="75"
                    y="13"
                    width="12"
                    height="12"
                    rx="1"
                    fill="#0b1220"
                  />
                  {/* Finder bottom-left */}
                  <rect
                    x="5"
                    y="67"
                    width="28"
                    height="28"
                    rx="3"
                    fill="#0b1220"
                  />
                  <rect
                    x="9"
                    y="71"
                    width="20"
                    height="20"
                    rx="2"
                    fill="white"
                  />
                  <rect
                    x="13"
                    y="75"
                    width="12"
                    height="12"
                    rx="1"
                    fill="#0b1220"
                  />
                  {/* Timing strips */}
                  {[38, 42, 46, 50, 54, 58, 62].map((x) => (
                    <rect
                      key={"tx" + x}
                      x={x}
                      y="5"
                      width="3"
                      height="3"
                      fill="#0b1220"
                    />
                  ))}
                  {[38, 42, 46, 50, 54, 58, 62].map((x) => (
                    <rect
                      key={"bx" + x}
                      x={x}
                      y="92"
                      width="3"
                      height="3"
                      fill="#0b1220"
                    />
                  ))}
                  {[38, 42, 46, 50, 54, 58, 62].map((y) => (
                    <rect
                      key={"ly" + y}
                      x="5"
                      y={y}
                      width="3"
                      height="3"
                      fill="#0b1220"
                    />
                  ))}
                  {[38, 42, 46, 50, 54, 58, 62].map((y) => (
                    <rect
                      key={"ry" + y}
                      x="92"
                      y={y}
                      width="3"
                      height="3"
                      fill="#0b1220"
                    />
                  ))}
                  {/* Data modules */}
                  {[
                    [38, 38],
                    [42, 42],
                    [46, 38],
                    [50, 46],
                    [54, 42],
                    [58, 38],
                    [38, 50],
                    [46, 50],
                    [54, 50],
                    [38, 58],
                    [42, 54],
                    [50, 58],
                    [58, 54],
                    [42, 46],
                    [50, 42],
                    [58, 46],
                    [46, 54],
                    [62, 42],
                    [62, 54],
                    [62, 46],
                  ].map(([x, y]) => (
                    <rect
                      key={`d${x}${y}`}
                      x={x}
                      y={y}
                      width="3"
                      height="3"
                      fill="#0b1220"
                    />
                  ))}
                </svg>
              </div>
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Scan to download
                <br />
                the Trimly app
              </p>
              <div className="flex gap-2">
                <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-slate-400">
                  App Store
                </span>
                <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-slate-400">
                  Google Play
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative px-6 py-24 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#ABD5FF]/15 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[#1a3a6e]/25 blur-[100px]" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Ready to transform your salon?
          </h2>
          <p className="text-slate-400 mb-10">
            Join thousands of salons already running smarter with Trimly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/auth/login?screen_hint=signup&role=admin"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#274b72] to-[#1a3558] border border-[#ABD5FF]/30 text-[#ABD5FF] hover:border-[#ABD5FF]/60 hover:shadow-[0_0_30px_rgba(171,213,255,0.2)] transition-all duration-300"
            >
              Create free account
            </a>
            <a
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-medium text-sm border border-white/10 text-slate-300 hover:bg-white/5 transition-all"
            >
              Already have an account? Sign in
            </a>
          </div>
          <p className="mt-6 text-xs text-slate-600">
            No credit card required · Free 14-day trial
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo_cropped.png" alt="Trimly" className="h-5 opacity-40" />
        <p>© {new Date().getFullYear()} Trimly. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="/privacy" className="hover:text-slate-400 transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-slate-400 transition-colors">
            Terms
          </a>
        </div>
      </footer>
    </main>
  );
}
