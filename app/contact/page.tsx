"use client";

import { theme } from "../components/Theme";
import { useState } from "react";
import { Calendar, User, Mail, Phone, Users } from "lucide-react";
import Wave from "react-wavify";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    participants: "",
    date: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitted(true);
    setForm({ name: "", email: "", phone: "", eventType: "", participants: "", date: "", message: "" });
  };

  return (
    <main className="text-gray-200">
      {/* ================= HERO ================= */}
      <section
        className="relative min-h-screen flex items-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1618609377864-68609b857e90?q=80&w=1828&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, ${theme.bgFrom}cc, ${theme.bgTo}66)` }}
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
              className="inline-block px-14 py-6 rounded-full font-semibold text-lg transition hover:scale-105"
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
          <div className="group relative rounded-3xl p-10 bg-[var(--surface-2)] shadow-xl transition hover:-translate-y-2 hover:shadow-purple-600/30">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Anfrage <span style={{ color: theme.primary }}>senden</span>
            </h2>

            {submitted && (
              <div className="bg-purple-600 text-white p-4 rounded-xl mb-6 text-center">
                Danke! Wir haben deine Anfrage erhalten und melden uns bald.
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                {[{
                  icon: User,
                  name: "name",
                  type: "text",
                  placeholder: "Name",
                  required: true
                }, {
                  icon: Mail,
                  name: "email",
                  type: "email",
                  placeholder: "E-Mail",
                  required: true
                }].map(({ icon: Icon, name, type, placeholder, required }) => (
                  <div key={name} className="flex items-center gap-3 bg-[var(--surface-3)] p-4 rounded-xl border border-purple-600 focus-within:ring-2 focus-within:ring-purple-500">
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
                  icon: Phone,
                  name: "phone",
                  type: "tel",
                  placeholder: "Telefon"
                }, {
                  icon: Users,
                  name: "eventType",
                  type: "select",
                  placeholder: "Event-Typ"
                }].map(({ icon: Icon, name, type, placeholder }) => (
                  <div key={name} className="flex items-center gap-3 bg-[var(--surface-3)] p-4 rounded-xl border border-purple-600 focus-within:ring-2 focus-within:ring-purple-500">
                    <Icon size={24} className="text-purple-500" />
                    {type === "select" ? (
                      <select
                        name={name}
                        value={form[name as keyof typeof form]}
                        onChange={handleChange}
                        required
                        className="bg-transparent w-full text-white focus:outline-none"
                      >
                        <option value="">{placeholder}</option>
                        <option value="Geburtstag">Geburtstag</option>
                        <option value="Hochzeit">Hochzeit</option>
                        <option value="Firmenfeier">Firmenfeier</option>
                        <option value="Andere">Andere</option>
                      </select>
                    ) : (
                      <input
                        type={type}
                        name={name}
                        placeholder={placeholder}
                        value={form[name as keyof typeof form]}
                        onChange={handleChange}
                        className="bg-transparent w-full text-white placeholder-gray-400 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[{
                  icon: Users,
                  name: "participants",
                  type: "number",
                  placeholder: "Teilnehmerzahl"
                }, {
                  icon: Calendar,
                  name: "date",
                  type: "date",
                  placeholder: "Datum"
                }].map(({ icon: Icon, name, type, placeholder }) => (
                  <div key={name} className="flex items-center gap-3 bg-[var(--surface-3)] p-4 rounded-xl border border-purple-600 focus-within:ring-2 focus-within:ring-purple-500">
                    <Icon size={24} className="text-purple-500" />
                    <input
                      type={type}
                      name={name}
                      placeholder={placeholder}
                      value={form[name as keyof typeof form]}
                      onChange={handleChange}
                      className="bg-transparent w-full text-white placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <textarea
                name="message"
                placeholder="Deine Nachricht / Wünsche"
                value={form.message}
                onChange={handleChange}
                rows={5}
                className="w-full p-4 rounded-xl bg-[var(--surface-3)] border border-purple-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <button
                type="submit"
                className="w-full px-10 py-4 bg-purple-600 rounded-full font-semibold text-lg hover:scale-105 transition shadow-lg text-white"
              >
                Anfrage senden
              </button>
            </form>
          </div>

          {/* INFO / CTA BOX */}
          <div className="group relative rounded-3xl p-10 bg-[var(--surface-2)] shadow-xl transition hover:-translate-y-2 hover:shadow-purple-600/30 flex flex-col justify-center gap-6">
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
