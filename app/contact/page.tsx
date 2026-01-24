"use client";

import { theme } from "../components/Theme";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, User, Mail, Phone, Users, UserPlus, Send } from "lucide-react";
import Wave from "react-wavify";

export default function Contact() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    eventType: "",
    participants: "",
    date: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [pendingForm, setPendingForm] = useState<typeof form | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setPendingForm(form);
    setShowAccountPrompt(true);
  };

  const submitAsGuest = async (payload: typeof form) => {
    setSubmitError(null);
    setSubmitting(true);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setSubmitError(data?.error ?? "Oh, das hat leider nicht funktioniert.");
      setShowAccountPrompt(false);
      setPendingForm(null);
      return;
    }
    setSubmitted(true);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      eventType: "",
      participants: "",
      date: "",
      message: "",
    });
    setShowAccountPrompt(false);
    setPendingForm(null);
  };

  const handleAccountCreate = () => {
    const payload = pendingForm ?? form;
    const params = new URLSearchParams();
    if (payload.firstName) params.set("firstName", payload.firstName);
    if (payload.lastName) params.set("lastName", payload.lastName);
    if (payload.email) params.set("email", payload.email);
    if (payload.phone) params.set("phone", payload.phone);
    if (payload.eventType) params.set("eventType", payload.eventType);
    if (payload.participants) params.set("participants", payload.participants);
    if (payload.date) params.set("date", payload.date);
    if (payload.message) params.set("message", payload.message);
    router.push(`/signup?${params.toString()}`);
  };

  return (
    <main className="text-gray-200">
      {/* ================= HERO ================= */}
      <section
        className="hero-area relative min-h-screen flex items-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1618609377864-68609b857e90?q=80&w=1828&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, ${theme.heroFrom}cc, ${theme.heroTo}66)` }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Kontaktiere <span style={{ color: theme.primary }}>Uns</span>
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-gray-300 mb-12">
            Jetzt unverbindlich anfragen für dein Event – wir freuen uns auf deine Nachricht!
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <a
              href="#form"
              className="btn-primary inline-block px-14 py-6 rounded-full font-semibold text-lg text-white transition hover:scale-105"
              style={{ backgroundColor: theme.primary }}
            >
              Mehr erfahren
            </a>
          </div>
        </div>

        <div className="absolute -bottom-2 left-0 right-0">
          <Wave
            fill="rgba(168,85,247,0.6)"
            paused={false}
            options={{ height: 90, amplitude: 35, speed: 0.2, points: 6 }}
          />
        </div>
      </section>

      {/* ================= FORM SECTION ================= */}
      <section id="form" className="py-32 px-6" style={{ background: theme.bgTo }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Kontaktformular */}
          <div className="group relative rounded-3xl p-10 bg-(--surface-2) shadow-xl transition hover:-translate-y-2 hover:shadow-purple-600/30">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Anfrage <span style={{ color: theme.primary }}>senden</span>
            </h2>

            {submitted && (
              <div className="bg-purple-600 text-white p-4 rounded-xl mb-6 text-center">
                Danke! Wir haben deine Anfrage erhalten und melden uns bald.
              </div>
            )}
            {submitError && (
              <div className="bg-red-500/10 text-red-200 border border-red-500/30 p-4 rounded-xl mb-6 text-center">
                {submitError}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                {[{
                  icon: User,
                  name: "firstName",
                  type: "text",
                  placeholder: "Vorname",
                  required: true
                }, {
                  icon: User,
                  name: "lastName",
                  type: "text",
                  placeholder: "Nachname",
                  required: true
                }].map(({ icon: Icon, name, type, placeholder, required }) => (
                  <div key={name} className="flex items-center gap-3 bg-(--surface-3) p-4 rounded-xl border border-purple-600 focus-within:ring-2 focus-within:ring-purple-500">
                    <Icon size={24} className="text-purple-500" />
                    <input
                      type={type}
                      name={name}
                      placeholder={placeholder}
                      value={form[name as keyof typeof form]}
                      onChange={handleChange}
                      required={required}
                      className="bg-transparent w-full text-white placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[{
                  icon: Mail,
                  name: "email",
                  type: "email",
                  placeholder: "E-Mail",
                  required: true
                }, {
                  icon: Phone,
                  name: "phone",
                  type: "tel",
                  placeholder: "Telefon"
                }].map(({ icon: Icon, name, type, placeholder, required }) => (
                  <div key={name} className="flex items-center gap-3 bg-(--surface-3) p-4 rounded-xl border border-purple-600 focus-within:ring-2 focus-within:ring-purple-500">
                    <Icon size={24} className="text-purple-500" />
                    <input
                      type={type}
                      name={name}
                      placeholder={placeholder}
                      value={form[name as keyof typeof form]}
                      onChange={handleChange}
                      required={required}
                      className="bg-transparent w-full text-white placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3 bg-(--surface-3) p-4 rounded-xl border border-purple-600 focus-within:ring-2 focus-within:ring-purple-500">
                  <Users size={24} className="text-purple-500" />
                  <select
                    name="eventType"
                    value={form.eventType}
                    onChange={handleChange}
                    required
                    className="bg-transparent w-full text-white focus:outline-none"
                  >
                    <option value="">Event-Typ</option>
                    <option value="Geburtstag">Geburtstag</option>
                    <option value="Hochzeit">Hochzeit</option>
                    <option value="Firmenfeier">Firmenfeier</option>
                    <option value="Andere">Andere</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 bg-(--surface-3) p-4 rounded-xl border border-purple-600 focus-within:ring-2 focus-within:ring-purple-500">
                  <Users size={24} className="text-purple-500" />
                  <input
                    type="number"
                    name="participants"
                    placeholder="Teilnehmerzahl"
                    value={form.participants}
                    onChange={handleChange}
                    className="bg-transparent w-full text-white placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-(--surface-3) p-4 rounded-xl border border-purple-600 focus-within:ring-2 focus-within:ring-purple-500">
                <Calendar size={24} className="text-purple-500" />
                <input
                  type="date"
                  name="date"
                  placeholder="Datum"
                  value={form.date}
                  onChange={handleChange}
                  className="bg-transparent w-full text-white placeholder-gray-400 focus:outline-none"
                />
              </div>

              <textarea
                name="message"
                placeholder="Deine Nachricht / Wünsche"
                value={form.message}
                onChange={handleChange}
                rows={5}
                className="w-full p-4 rounded-xl bg-(--surface-3) border border-purple-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <button
                type="submit"
                className="btn-primary w-full px-10 py-4 bg-purple-600 rounded-full font-semibold text-lg hover:scale-105 transition shadow-lg text-white"
              >
                Anfrage senden
              </button>
            </form>
            {showAccountPrompt && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
                <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-(--surface-2) p-8 text-center shadow-2xl">
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    Account erstellen?
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Entscheide dich jetzt: Anfrage direkt senden oder Konto anlegen,
                    um alles im Kundenportal zu verwalten.
                  </p>
                  <div className="mb-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-(--surface-3) p-4 text-left">
                      <div className="flex items-center gap-3 text-white">
                        <Send size={22} className="text-purple-400" />
                        <span className="text-sm font-semibold">Als Gast fortfahren</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Schnell senden, keine Registrierung notwendig.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-(--surface-3) p-4 text-left">
                      <div className="flex items-center gap-3 text-white">
                        <UserPlus size={22} className="text-purple-400" />
                        <span className="text-sm font-semibold">Account erstellen</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Anfrage wird automatisch deinem Konto zugeordnet.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        const payload = pendingForm ?? form;
                        submitAsGuest(payload);
                      }}
                      disabled={submitting}
                      className="rounded-full px-5 py-3 text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                    >
                      {submitting ? "Bitte warten..." : "Als Gast fortfahren"}
                    </button>
                    <button
                      type="button"
                      onClick={handleAccountCreate}
                      className="btn-primary rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                      style={{ backgroundColor: theme.primary }}
                    >
                      Account erstellen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAccountPrompt(false);
                        setPendingForm(null);
                      }}
                      className="rounded-full px-5 py-3 text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INFO / CTA BOX */}
          <div className="group relative rounded-3xl p-10 bg-(--surface-2) shadow-xl transition hover:-translate-y-2 hover:shadow-purple-600/30 flex flex-col justify-center gap-6">
            <h3 className="text-3xl font-bold text-white">
              Kontaktiere uns direkt
            </h3>
            <p className="text-gray-400">
              Telefonisch oder per E-Mail – wir melden uns schnellstmöglich.
            </p>
            <p>
              <a href="tel:+491706480129" className="text-purple-500 hover:underline">+49 170 6480129</a><br/>
              <a href="mailto:info@rohde-audio.com" className="text-purple-500 hover:underline">info@rohde-audio.com</a>
            </p>
            <p className="text-gray-400 mt-4">
              Plane jetzt dein Event mit uns – wir helfen dir, die perfekte Anlage zu finden!
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
