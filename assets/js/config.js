/* Waar de live gegevens staan.
   Zodra het beheer de Gist heeft aangemaakt (beheer.html → "Nieuwe Gist aanmaken"),
   zet je het id en de GitHub-naam hier neer en push je (het tabblad Instellingen
   laat de exacte regels zien). Tot die tijd ziet elke bezoeker data/site.json. */
export const CONFIG = {
  gistId: 'a69b8260bfa32821d0057eb774d4c8c3',
  // GitHub-gebruiker die de Gist bezit. Nodig voor de CDN-terugval als de
  // API-limiet (60 verzoeken/uur per IP) bereikt is.
  gistOwner: 'ryanifa',
  gistFile: 'site.json',
  // Formspree-formulier-id voor contact.html (https://formspree.io → New form).
  // Placeholder: het formulier werkt pas als hier het echte id staat.
  formspreeId: 'FORMSPREE_ID',
  // GoatCounter-code (cookieloos). Leeg = geen statistieken.
  goatcounter: '',
};
