import Navbar from "../components/Navbar";
import ContactForm from "./ContactForm";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-295 px-6 py-16 sm:py-20">
        <p className="text-[11px] font-extrabold tracking-[.16em] text-[#075aa6]">
          WE WOULD LOVE TO HEAR FROM YOU
        </p>
        <h1 className="mt-2 font-condensed text-6xl font-black uppercase leading-[.82] text-[#071b33] sm:text-7xl">
          Contact Us
        </h1>
        <div className="mt-10 grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <section className="bg-[#071b33] p-8 text-white sm:p-10">
            <h2 className="font-condensed text-4xl font-extrabold uppercase">Club Office</h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
              For general enquiries, memberships and matchday information, our team is ready to
              help.
            </p>
            <div className="mt-10 space-y-7 text-sm">
              <ContactItem
                label="VISIT US"
                detail={
                  <>
                    Unity Park, Udoudoma Avenue
                    <br />
                    Opposite Central Bank of Nigeria,
                    <br />
                    Uyo, Akwa Ibom State
                  </>
                }
              />
              <ContactItem label="CALL US" detail="+234 (0) 706 183 2387, +234 (0) 703 182 5057" />
              {/* <ContactItem label="CALL US" detail="+234 (0) 703 182 5057" /> */}
              <ContactItem label="EMAIL US" detail="hello@pillarsfc.ng" />
              <ContactItem
                label="TRAINING HOURS"
                detail={
                  <>
                    Saturday
                    <br />
                    7:30 AM – 11:00 AM WAT
                  </>
                }
              />
            </div>
          </section>
          <section className="bg-white p-7 shadow-[0_6px_26px_rgba(13,35,50,.06)] sm:p-10">
            <ContactForm />
          </section>
        </div>
      </main>
    </>
  );
}
function ContactItem({ label, detail }: { label: string; detail: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-extrabold tracking-[.15em] text-[#f6b71d]">{label}</p>
      <p className="mt-1 leading-6 text-slate-200">{detail}</p>
    </div>
  );
}
