# Jordaan Boerdery Trust
PWA starter vir plaasbestuur. Supabase is die sentrale databasis; IndexedDB hou 'n plaaslike waglys; die service worker cache die app-lêers.

## Opstelling
1. Skep 'n projek by https://supabase.com.
2. Voer `supabase/schema.sql` in SQL Editor uit.
3. Kopieer Project URL en Publishable/anon key na `config.js`. MOET NOOIT service_role/secret key in frontend kode sit nie.
4. Skep baas se gebruiker in Supabase Auth en stel profiel: `update public.profiles set role='admin' where id='AUTH-UUID';`
5. Koppel voormanne aan hul plaas: `update public.profiles set role='foreman', farm_id='FARM-UUID' where id='AUTH-UUID';`
6. Koppel werker se Auth profiel aan `worker_id` en role `worker`.
7. Gebruik HTTPS hosting (bv. GitHub Pages); toets alle RLS policies met aparte admin-, voorman- en werkerrekeninge.

## Ingesluit
Dashboard; plase; werkers; kampe/hektare/vee/notas/scans; voertuie/engine nommers/job cards; voorraad (Gereedskap en Dranksoen & Voer); aankoopversoeke met baasgoedkeuring; inkomste/uitgawes en slips; take; login; PWA.

## Sekuriteit en funksies
Hierdie is 'n starter wat verdere produksietoetsing benodig. RLS is noodsaaklik vir persoonlike werkerdata. Werkers behoort slegs eie persoonlike data en eie take te sien; voormanne hul plaas; admin alles. Private dokumente gebruik 'n private Storage bucket. Push/SMS kennisgewings wanneer die app toe is vereis 'n Edge Function en eksterne diens; die app se interne taaklys is reeds beskikbaar. Offline veranderinge wag in IndexedDB tot verbinding herstel. Dokumentoplaai vereis internet. Konflikhantering en sekuriteit moet voor regte gebruik getoets word.
