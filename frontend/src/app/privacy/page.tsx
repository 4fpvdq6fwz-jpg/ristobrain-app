export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-900 text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-dark-300 text-sm mb-8">Ultimo aggiornamento: Giugno 2025</p>
        <div className="space-y-8 text-sm text-dark-200 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Titolare del Trattamento</h2>
            <p>Il titolare del trattamento dei dati personali e RistoBrain. Per qualsiasi domanda contattaci via email.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Dati Raccolti</h2>
            <ul className="list-disc list-inside space-y-1 text-dark-300">
              <li>Nome e cognome, indirizzo email</li>
              <li>Nome del ristorante/workspace</li>
              <li>Dati di utilizzo (ricette, ingredienti, menu, vendite)</li>
              <li>Pagamenti gestiti da Stripe (non archiviati da noi)</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Finalita</h2>
            <ul className="list-disc list-inside space-y-1 text-dark-300">
              <li>Fornire e migliorare il servizio</li>
              <li>Gestire account e workspace</li>
              <li>Elaborare pagamenti tramite Stripe</li>
              <li>Adempiere a obblighi legali</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. I Tuoi Diritti (GDPR)</h2>
            <ul className="list-disc list-inside space-y-1 text-dark-300">
              <li>Accesso e rettifica dei tuoi dati</li>
              <li>Cancellazione account (disponibile in Impostazioni)</li>
              <li>Portabilita dati in JSON (disponibile in Impostazioni)</li>
              <li>Opposizione al trattamento per legittimo interesse</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Cookie</h2>
            <p>Solo cookie tecnici necessari (sessione autenticazione). Nessun cookie pubblicitario o di profilazione.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Contatti</h2>
            <p>Per richieste privacy, contattaci via email. Puoi proporre reclamo al Garante Privacy (www.garanteprivacy.it).</p>
          </section>
        </div>
        <div className="mt-12 pt-8 border-t border-dark-700">
          <a href="/login" className="text-sm text-dark-400 hover:text-white">Torna al login</a>
        </div>
      </div>
    </div>
  );
}
